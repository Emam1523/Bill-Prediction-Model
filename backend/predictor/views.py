"""
Django views — API backend for the ElectriBill AI React frontend.

Speed optimisations
───────────────────
• _static_cache  – bill_hist, box_data, scatter, correlation, summary are
                   derived purely from the raw DataFrame and NEVER change.
                   Computed once on first request, reused forever.
• _kcomp_cache   – k-comparison (13 kNN models) is expensive but only
                   depends on the train/test split, not on k.
                   Cached per split value so a split-change pays the cost
                   once and a k-change is free.
• _cache         – DataFrame + currently-trained model (k + split aware).
"""
import json

import numpy as np
import pandas as pd
from django.conf import settings
from django.http import JsonResponse, FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import HouseholdRecord
from .knn_model import (
    KNNRegressor,
    load_from_db,
    calc_mae,
    calc_rmse,
    calc_mape,
    FEATURE_NAMES,
)


# ═══════════════════════════════════════════════════════════════════════
# CACHES
# ═══════════════════════════════════════════════════════════════════════

# Model + current-split train/test data
_cache = {
    "df": None,
    "train": None,   # raw rows for the current split
    "test": None,
    "stats": None,
    "model": None,
    "ev": None,
    "k": None,
    "train_ratio": None,
}

# Static chart data — computed once from the full DataFrame, never changes
_static_cache: dict = {}

# k-comparison results keyed by split value (only recalculated when split changes)
_kcomp_cache: dict = {}


# ── Helpers ─────────────────────────────────────────────────────────
def _get_df():
    """Load and cache the full DataFrame from PostgreSQL (done once)."""
    if _cache["df"] is None:
        qs = HouseholdRecord.objects.values_list(*HouseholdRecord.FIELD_ORDER)
        _cache["df"] = pd.DataFrame(list(qs), columns=FEATURE_NAMES)
    return _cache["df"]


def _get_split_data(train_ratio: float):
    """Cache the train/test split (deterministic via seed=42)."""
    if _cache["train_ratio"] != train_ratio or _cache["train"] is None:
        train, test, stats = load_from_db(train_ratio, seed=42)
        _cache.update(train=train, test=test, stats=stats)
        # Invalidate model whenever the split changes
        _cache.update(model=None, ev=None, k=None)
    return _cache["train"], _cache["test"], _cache["stats"]


def _get_model(k: int = 9, train_ratio: float = 0.90):
    """Train and cache the kNN model. Re-trains only when k or split changes."""
    if _cache["model"] and _cache["k"] == k and _cache["train_ratio"] == train_ratio:
        return _cache["model"], _cache["ev"]

    train, test, stats = _get_split_data(train_ratio)
    model = KNNRegressor(k=k)
    model.fit(train, stats)
    preds = model.predict(test)
    actual = [r[-1] for r in test]

    ev = {
        "train": len(train),
        "test": len(test),
        "mae": round(calc_mae(actual, preds), 2),
        "rmse": round(calc_rmse(actual, preds), 2),
        "mape": round(calc_mape(actual, preds), 2),
        "preds": preds,
        "actual": actual,
    }
    _cache.update(model=model, ev=ev, k=k, train_ratio=train_ratio)
    return model, ev


def _get_static_dash(df: pd.DataFrame) -> dict:
    """
    Compute chart data that depends only on the raw DataFrame.
    Result is cached forever — a k or split change does NOT invalidate it.
    """
    if _static_cache:
        return _static_cache

    # Bill distribution histogram
    counts, bin_edges = np.histogram(df["DOLLAREL"].dropna(), bins=60)
    _static_cache["bill_hist"] = {
        "bins": [round(float(b), 1) for b in bin_edges[:-1]],
        "counts": [int(c) for c in counts],
        "mean": round(float(df["DOLLAREL"].mean()), 1),
    }

    # Box plot data by housing type
    box_data = {}
    for t in sorted(df["TYPEHUQ"].unique()):
        vals = df.loc[df["TYPEHUQ"] == t, "DOLLAREL"].dropna().to_numpy()
        if len(vals):
            box_data[int(t)] = {
                "min":    round(float(vals.min()), 1),
                "q1":     round(float(np.percentile(vals, 25)), 1),
                "median": round(float(np.median(vals)), 1),
                "q3":     round(float(np.percentile(vals, 75)), 1),
                "max":    round(float(vals.max()), 1),
            }
    _static_cache["box_data"] = box_data

    # Scatter sample (kWh vs Bill) — fixed random_state so it's reproducible
    samp = df.sample(min(1500, len(df)), random_state=1)
    _static_cache["scatter"] = {
        "x":    [round(float(v), 1) for v in samp["KWH"]],
        "y":    [round(float(v), 1) for v in samp["DOLLAREL"]],
        "type": [int(v) for v in samp["TYPEHUQ"]],
    }

    # Correlation with DOLLAREL (most expensive step — done only once)
    corr = (
        df[FEATURE_NAMES]
        .corr()["DOLLAREL"]
        .drop("DOLLAREL")
        .sort_values(ascending=False)
    )
    _static_cache["correlation"] = {
        "features": corr.index.tolist(),
        "values":   [round(float(v), 3) for v in corr.values],
    }

    # Summary statistics
    stat_cols = [c for c in ["DOLLAREL", "KWH", "TOTSQFT", "BEDROOMS", "HEATROOM", "ACROOMS"] if c in df.columns]
    summary = {}
    for col in stat_cols:
        desc = df[col].describe()
        summary[col] = {stat: round(float(v), 1) for stat, v in desc.items()}
    _static_cache["summary"] = summary

    return _static_cache


def _get_kcomp(split: float) -> dict:
    """
    Run kNN for k=1..25 (odd) and cache the result per split value.
    Only recomputed when the split changes.
    """
    key = round(split, 2)
    if key in _kcomp_cache:
        return _kcomp_cache[key]

    train, test, stats = _get_split_data(split)
    actual = [r[-1] for r in test]
    rows = []
    for kv in range(1, 26, 2):
        m = KNNRegressor(k=kv)
        m.fit(train, stats)
        p = m.predict(test)
        rows.append({
            "k":    kv,
            "mae":  round(calc_mae(actual, p), 2),
            "rmse": round(calc_rmse(actual, p), 2),
        })

    best_k = min(rows, key=lambda r: r["mae"])["k"]
    result = {"rows": rows, "best_k": best_k}
    _kcomp_cache[key] = result
    return result


# ═══════════════════════════════════════════════════════════════════════
# SERVE REACT SPA
# ═══════════════════════════════════════════════════════════════════════
def serve_react(request, *args, **kwargs):
    """Serve the React build's index.html (SPA catch-all)."""
    index = settings.REACT_BUILD_DIR / "index.html"
    if index.exists():
        return FileResponse(open(index, "rb"), content_type="text/html")
    return HttpResponse(
        "<h2>Run <code>cd frontend &amp;&amp; npm install &amp;&amp; npm run build</code> first.</h2>",
        status=200,
    )


# ═══════════════════════════════════════════════════════════════════════
# API VIEWS
# ═══════════════════════════════════════════════════════════════════════

@csrf_exempt
@require_POST
def api_train(request):
    """Train the model with given k & split, return metrics."""
    data = json.loads(request.body)
    k = int(data.get("k", 9))
    split = float(data.get("split", 0.90))
    model, ev = _get_model(k, split)
    return JsonResponse(
        {
            "train": ev["train"],
            "test": ev["test"],
            "mae": ev["mae"],
            "rmse": ev["rmse"],
            "mape": ev["mape"],
            "accuracy": round(max(0, 100 - ev["mape"]), 1),
            "k": k,
            "split": split,
        }
    )


@csrf_exempt
@require_POST
def api_predict(request):
    """Predict annual bill for a 23-feature input vector."""
    data = json.loads(request.body)
    features = [float(data["features"][i]) for i in range(23)]
    k = int(data.get("k", _cache.get("k") or 9))
    split = float(data.get("split", _cache.get("train_ratio") or 0.90))
    model, ev = _get_model(k, split)
    predicted = model.predict_one(features)

    df = _get_df()
    avg = float(df["DOLLAREL"].mean())
    median = float(df["DOLLAREL"].median())
    pct_rank = float((df["DOLLAREL"] < predicted).mean() * 100)

    return JsonResponse(
        {
            "predicted": round(predicted, 2),
            "monthly": round(predicted / 12, 2),
            "avg": round(avg, 2),
            "median": round(median, 2),
            "pct_rank": round(pct_rank, 1),
            "delta_pct": round(((predicted - avg) / avg) * 100, 1) if avg else 0,
        }
    )


@csrf_exempt
@require_POST
def api_dashboard(request):
    """
    Return all data needed for the dashboard charts.

    Static parts (bill_hist, box_data, scatter, correlation, summary) come
    from _static_cache and are computed only once per server lifetime.
    Dynamic parts (pred_vs_act, residual_hist) are sliced from the already-
    trained model evaluation — very fast after the first /api/train call.
    """
    data = json.loads(request.body)
    k = int(data.get("k", _cache.get("k") or 9))
    split = float(data.get("split", _cache.get("train_ratio") or 0.90))
    model, ev = _get_model(k, split)
    df = _get_df()

    # ── Static (cached) ────────────────────────────────────────────────
    static = _get_static_dash(df)

    # ── Dynamic: depends on current k + split ──────────────────────────
    n = min(400, len(ev["actual"]))
    pred_vs_act = {
        "actual":    [round(a, 1) for a in ev["actual"][:n]],
        "predicted": [round(p, 1) for p in ev["preds"][:n]],
    }

    residuals = [round(p - a, 1) for p, a in zip(ev["preds"], ev["actual"])]
    res_counts, res_bins = np.histogram(residuals, bins=60)
    residual_hist = {
        "bins":   [round(float(b), 1) for b in res_bins[:-1]],
        "counts": [int(c) for c in res_counts],
        "mean":   round(float(np.mean(residuals)), 1),
    }

    return JsonResponse({
        **static,
        "pred_vs_act":  pred_vs_act,
        "residual_hist": residual_hist,
        "k": k,
    })


@csrf_exempt
@require_POST
def api_k_comparison(request):
    """
    Return MAE/RMSE for k=1..25 (odd).
    Result is cached per split so a k-slider change costs nothing here.
    """
    data = json.loads(request.body)
    split = float(data.get("split", 0.90))
    return JsonResponse(_get_kcomp(split))

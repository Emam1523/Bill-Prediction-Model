"""
knn_model.py — kNN Regression for Electricity Bill Prediction (Django version)
--------------------------------------------------------------------------------
Same from-scratch kNN regressor as the original, but loads data from
PostgreSQL via Django ORM instead of CSV.
"""

import random
import numpy as np

# ── Feature schema (24 columns: 23 inputs + 1 target) ───────────
FEATURE_NAMES = [
    "TYPEHUQ", "HDD30YR", "CDD30YR", "BEDROOMS", "NCOMBATH", "TOTROOMS",
    "CELLAR", "GARGHEAT", "HEATROOM", "ACROOMS", "USECENAC", "TEMPNITEAC",
    "TOTSQFT", "TOTHSQFT", "TOTCSQFT", "KWH", "KWHCOL", "KWHRFG", "KWHOTH",
    "DOLELCOL", "DOLELWTH", "DOLELRFG", "DOLELOTH", "DOLLAREL",
]

# ── Data loading (from DB rows) ──────────────────────────────────
def load_from_db(train_ratio: float = 0.90, seed: int = 42):
    """Load all HouseholdRecords from PostgreSQL, split into train/test.

    Returns (train, test, stats) identical to the original load_dataset().
    """
    from predictor.models import HouseholdRecord

    random.seed(seed)
    qs = HouseholdRecord.objects.values_list(*HouseholdRecord.FIELD_ORDER)
    rows = [list(r) for r in qs]

    if not rows:
        raise ValueError("No records in the database — ensure PostgreSQL is running and the electribill DB is populated.")

    arr = np.array(rows, dtype=np.float64)
    stats = {"min": arr.min(axis=0), "max": arr.max(axis=0)}

    train, test = [], []
    for row in rows:
        (train if random.random() < train_ratio else test).append(row)

    return train, test, stats



# ── kNN Regressor (NumPy-vectorised) ─────────────────────────────
class KNNRegressor:
    """k-Nearest Neighbours regressor with vectorised distance computation."""

    def __init__(self, k: int = 9):
        self.k = k
        self._train_features = np.empty(0)
        self._train_labels = np.empty(0)
        self._col_min = np.empty(0)
        self._col_range = np.empty(0)

    def fit(self, training_set: list, stats: dict):
        arr = np.array(training_set, dtype=np.float64)
        self._train_labels = arr[:, -1].copy()

        col_min = stats["min"][:-1]
        col_max = stats["max"][:-1]
        col_range = col_max - col_min
        col_range[col_range == 0] = 1.0

        self._col_min = col_min
        self._col_range = col_range
        self._train_features = (arr[:, :-1] - col_min) / col_range

    def predict_one(self, features: list) -> float:
        x = (np.array(features, dtype=np.float64) - self._col_min) / self._col_range
        dists = np.sqrt(np.sum((self._train_features - x) ** 2, axis=1))
        idx = np.argpartition(dists, self.k)[: self.k]
        return float(np.mean(self._train_labels[idx]))

    def predict(self, test_set: list) -> list:
        test_arr = np.array(test_set, dtype=np.float64)[:, :-1]
        test_norm = (test_arr - self._col_min) / self._col_range
        preds = []
        for x in test_norm:
            dists = np.sqrt(np.sum((self._train_features - x) ** 2, axis=1))
            idx = np.argpartition(dists, self.k)[: self.k]
            preds.append(float(np.mean(self._train_labels[idx])))
        return preds


# ── Metrics ──────────────────────────────────────────────────────
def calc_mae(actual, predicted):
    a, p = np.asarray(actual), np.asarray(predicted)
    return float(np.mean(np.abs(a - p)))


def calc_rmse(actual, predicted):
    a, p = np.asarray(actual), np.asarray(predicted)
    return float(np.sqrt(np.mean((a - p) ** 2)))


def calc_mape(actual, predicted):
    a = np.asarray(actual, dtype=np.float64)
    p = np.asarray(predicted, dtype=np.float64)
    mask = a != 0
    if not np.any(mask):
        return float("inf")
    return float(100 * np.mean(np.abs((a[mask] - p[mask]) / a[mask])))

import { useState, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../api';
import { useModel } from '../context/ModelContext';

const fmt = (n) => Number(n).toLocaleString('en-US');

export default function PredictTab() {
  const { k, split, billHistData, setBillHistData } = useModel();

  /* ── Form state ── */
  const [form, setForm] = useState({
    typehuq: 2, hdd30yr: 3500, cdd30yr: 1200,
    bedrooms: 3, ncombath: 2, totrooms: 7,
    cellar: false, gargheat: false,
    heatroom: 5, acrooms: 4, usecenac: 3, tempniteac: 72,
    totsqft: 1800, tothsqft: 1600, totcsqft: 1400,
    kwh: 11000, kwhcol: 2000, kwhrfg: 800, kwhoth: 6000,
    dolelcol: 200, dolelwth: 80, dolelrfg: 80, doleloth: 600,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef(null);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : +e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  /* ── Build features array in FEATURE_NAMES order ── */
  const buildFeatures = () => [
    +form.typehuq, +form.hdd30yr, +form.cdd30yr,
    +form.bedrooms, +form.ncombath, +form.totrooms,
    form.cellar ? 1 : 0, form.gargheat ? 1 : 0,
    +form.heatroom, +form.acrooms, +form.usecenac, +form.tempniteac,
    +form.totsqft, +form.tothsqft, +form.totcsqft,
    +form.kwh, +form.kwhcol, +form.kwhrfg, +form.kwhoth,
    +form.dolelcol, +form.dolelwth, +form.dolelrfg, +form.doleloth,
  ];

  /* ── Predict ── */
  const doPrediction = async () => {
    setLoading(true);
    try {
      const features = buildFeatures();
      const d = await api('/api/predict', { features, k, split });
      /* Also ensure billHistData is available */
      let hist = billHistData;
      if (!hist) {
        const dash = await api('/api/dashboard', { k, split });
        hist = dash.bill_hist;
        setBillHistData(hist);
      }
      setResult({ ...d, features, hist });
    } catch (e) {
      console.error('Predict error:', e);
      alert('Prediction failed. Check server console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3>&#127968; Enter Household Details</h3>
      <p className="text-muted">
        Fill in the fields below and click <b>Predict</b> to get an estimated annual electricity bill.
      </p>

      <div className="two-col">
        {/* ─── LEFT COLUMN ─── */}
        <div>
          <div className="stitle">&#127968; Housing Structure</div>
          <label className="field" htmlFor="f-typehuq">Housing Type</label>
          <select id="f-typehuq" value={form.typehuq} onChange={set('typehuq')}>
            <option value="1">1 &ndash; Mobile Home</option>
            <option value="2">2 &ndash; Single-Family Detached</option>
            <option value="3">3 &ndash; Single-Family Attached</option>
            <option value="4">4 &ndash; Apartment (2-4 units)</option>
            <option value="5">5 &ndash; Apartment (5+ units)</option>
          </select>
          <label className="field" htmlFor="f-bedrooms">Bedrooms</label>
          <input type="number" id="f-bedrooms" value={form.bedrooms} min="0" max="10" onChange={set('bedrooms')} />
          <label className="field" htmlFor="f-ncombath">Full Bathrooms</label>
          <input type="number" id="f-ncombath" value={form.ncombath} min="0" max="6" onChange={set('ncombath')} />
          <label className="field" htmlFor="f-totrooms">Total Rooms</label>
          <input type="number" id="f-totrooms" value={form.totrooms} min="1" max="20" onChange={set('totrooms')} />
          <div className="toggle-row">
            <input type="checkbox" id="f-cellar" checked={form.cellar} onChange={set('cellar')} />
            <label htmlFor="f-cellar">Has Basement / Cellar</label>
          </div>
          <div className="toggle-row">
            <input type="checkbox" id="f-gargheat" checked={form.gargheat} onChange={set('gargheat')} />
            <label htmlFor="f-gargheat">Heated Attached Garage</label>
          </div>

          <div className="stitle">&#128208; Square Footage</div>
          <label className="field" htmlFor="f-totsqft">Total Sq Ft</label>
          <input type="number" id="f-totsqft" value={form.totsqft} min="100" max="15000" step="50" onChange={set('totsqft')} />
          <label className="field" htmlFor="f-tothsqft">Heated Sq Ft</label>
          <input type="number" id="f-tothsqft" value={form.tothsqft} min="0" max="15000" step="50" onChange={set('tothsqft')} />
          <label className="field" htmlFor="f-totcsqft">Cooled Sq Ft</label>
          <input type="number" id="f-totcsqft" value={form.totcsqft} min="0" max="15000" step="50" onChange={set('totcsqft')} />

          <div className="stitle">&#127777;&#65039; Climate</div>
          <label className="field" htmlFor="f-hdd30yr">Heating Degree Days (HDD30YR)</label>
          <input type="number" id="f-hdd30yr" value={form.hdd30yr} min="0" max="12000" step="100" onChange={set('hdd30yr')} />
          <label className="field" htmlFor="f-cdd30yr">Cooling Degree Days (CDD30YR)</label>
          <input type="number" id="f-cdd30yr" value={form.cdd30yr} min="0" max="8000" step="100" onChange={set('cdd30yr')} />
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div>
          <div className="stitle">&#128293; Heating</div>
          <label className="field" htmlFor="f-heatroom">Rooms Heated</label>
          <input type="number" id="f-heatroom" value={form.heatroom} min="0" max="20" onChange={set('heatroom')} />

          <div className="stitle">&#10052;&#65039; Cooling / A/C</div>
          <label className="field" htmlFor="f-acrooms">Rooms Cooled</label>
          <input type="number" id="f-acrooms" value={form.acrooms} min="0" max="20" onChange={set('acrooms')} />
          <label className="field" htmlFor="f-usecenac">Central A/C Usage</label>
          <select id="f-usecenac" value={form.usecenac} onChange={set('usecenac')}>
            <option value="1">1 &ndash; All summer</option>
            <option value="2">2 &ndash; Most of summer</option>
            <option value="3">3 &ndash; Some days/nights</option>
            <option value="4">4 &ndash; Just a few days</option>
            <option value="5">5 &ndash; Never</option>
          </select>
          <label className="field" htmlFor="f-tempniteac">Night Thermostat (&deg;F)</label>
          <input type="number" id="f-tempniteac" value={form.tempniteac} min="60" max="90" onChange={set('tempniteac')} />

          <div className="stitle">&#9889; Electricity Usage (kWh)</div>
          <label className="field" htmlFor="f-kwh">Total kWh</label>
          <input type="number" id="f-kwh" value={form.kwh} min="0" max="60000" step="100" onChange={set('kwh')} />
          <label className="field" htmlFor="f-kwhcol">A/C kWh</label>
          <input type="number" id="f-kwhcol" value={form.kwhcol} min="0" max="20000" step="50" onChange={set('kwhcol')} />
          <label className="field" htmlFor="f-kwhrfg">Refrigerator kWh</label>
          <input type="number" id="f-kwhrfg" value={form.kwhrfg} min="0" max="5000" step="50" onChange={set('kwhrfg')} />
          <label className="field" htmlFor="f-kwhoth">Other kWh</label>
          <input type="number" id="f-kwhoth" value={form.kwhoth} min="0" max="40000" step="100" onChange={set('kwhoth')} />

          <div className="stitle">&#128176; Component Costs ($)</div>
          <label className="field" htmlFor="f-dolelcol">A/C Cost ($)</label>
          <input type="number" id="f-dolelcol" value={form.dolelcol} min="0" max="5000" step="10" onChange={set('dolelcol')} />
          <label className="field" htmlFor="f-dolelwth">Water Heater Cost ($)</label>
          <input type="number" id="f-dolelwth" value={form.dolelwth} min="0" max="2000" step="10" onChange={set('dolelwth')} />
          <label className="field" htmlFor="f-dolelrfg">Refrigerator Cost ($)</label>
          <input type="number" id="f-dolelrfg" value={form.dolelrfg} min="0" max="1000" step="5" onChange={set('dolelrfg')} />
          <label className="field" htmlFor="f-doleloth">Other Cost ($)</label>
          <input type="number" id="f-doleloth" value={form.doleloth} min="0" max="8000" step="10" onChange={set('doleloth')} />
        </div>
      </div>

      <button
        className="btn-predict"
        ref={btnRef}
        disabled={loading}
        onClick={doPrediction}
      >
        {loading ? '\u23f3 Finding nearest neighbours\u2026' : '\u26a1  Predict My Annual Electricity Bill'}
      </button>

      {/* ═══ PREDICTION RESULTS ═══ */}
      {result && <PredictionResults result={result} />}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────── */
function PredictionResults({ result }) {
  const { predicted, monthly, avg, median, pct_rank, delta_pct, features, hist } = result;
  const arrow = delta_pct > 0 ? '\u25b2' : '\u25bc';
  const word  = delta_pct > 0 ? 'above' : 'below';
  const kwh   = features[15];
  const rate  = kwh > 0 ? predicted / kwh : 0;

  /* Tier badge */
  let tierClass, tierContent;
  if (pct_rank < 33) {
    tierClass = 'alert-low';
    tierContent = <><b>Low energy usage</b> &mdash; your bill is cheaper than {(100 - pct_rank).toFixed(0)}% of surveyed US homes. Great job!</>;
  } else if (pct_rank < 67) {
    tierClass = 'alert-mid';
    tierContent = <><b>Average energy usage</b> &mdash; your bill falls in the {pct_rank.toFixed(0)}th percentile. Room for some savings!</>;
  } else {
    tierClass = 'alert-high';
    tierContent = <><b>High energy usage</b> &mdash; more expensive than {pct_rank.toFixed(0)}% of surveyed homes. Check the saving tips below!</>;
  }
  const tierIcon = pct_rank < 33 ? '\u2705' : pct_rank < 67 ? '\u26a1' : '\uD83D\uDD25';

  /* Donut data */
  const dolelcol = features[19], dolelwth = features[20], dolelrfg = features[21], doleloth = features[22];
  const totalCost = dolelcol + dolelwth + dolelrfg + doleloth;

  /* Where you stand */
  const binWidth = hist.bins.length > 1 ? hist.bins[1] - hist.bins[0] : 100;
  const bgColors = hist.bins.map((b, i) => {
    const nextB = i < hist.bins.length - 1 ? hist.bins[i + 1] : b + binWidth;
    return (predicted >= b && predicted < nextB) ? '#f472b6' : 'rgba(56,189,248,.4)';
  });

  /* Saving tips */
  const tips = [];
  const acrooms = features[9], tempniteac = features[11], totsqft = features[12];
  if (acrooms > 4)    tips.push({ icon: '\u2744\ufe0f', title: 'Reduce Cooled Rooms', body: 'Try cooling fewer rooms or raising the night thermostat 2\u20133 \u00b0F. Each degree saves ~3% on A/C bills.' });
  if (kwh > 15000)    tips.push({ icon: '\u26a1', title: 'High Consumption Alert', body: 'Your kWh is above average. Switch to LED lighting, smart power strips, and ENERGY STAR appliances.' });
  if (dolelwth > 120) tips.push({ icon: '\uD83D\uDEBF', title: 'Water Heating Savings', body: 'A heat-pump water heater uses 60% less energy than a traditional electric one.' });
  if (totsqft > 2500) tips.push({ icon: '\uD83C\uDFE0', title: 'Insulate Your Home', body: 'Sealing air leaks and adding insulation to a large home can cut heating & cooling costs by 15-30%.' });
  if (tempniteac < 68) tips.push({ icon: '\uD83C\uDF19', title: 'Raise Night Temp', body: `Raising your A/C night set-point from ${tempniteac}\u00b0F to 72\u00b0F can save ~$60/yr.` });
  if (!tips.length) {
    tips.push({ icon: '\u2705', title: 'Great Efficiency!', body: 'Your inputs look efficient. Regular HVAC filter changes keep performance at its best.' });
    tips.push({ icon: '\u2600\ufe0f', title: 'Consider Solar', body: 'With your usage profile, a solar panel system could offset 60-80% of your annual bill.' });
    tips.push({ icon: '\uD83D\uDCF1', title: 'Smart Thermostat', body: 'A programmable thermostat pays for itself within the first year for most US households.' });
  }

  return (
    <div>
      {/* Result card */}
      <div className="result-card">
        <div className="label-sm">Predicted Annual Electricity Bill</div>
        <div className="amt">${fmt(Math.round(predicted))}</div>
        <div className="monthly">${fmt(Math.round(monthly))} / month</div>
        <div className="context">
          Dataset avg <b>${fmt(Math.round(avg))}</b> &nbsp;&middot;&middot;&middot;&nbsp;
          You are <b>{arrow} {Math.abs(delta_pct).toFixed(1)}%</b> {word} average &nbsp;&middot;&middot;&middot;&nbsp;
          <b>{pct_rank.toFixed(0)}th</b> percentile
        </div>
      </div>

      {/* Tier badge */}
      <div className={tierClass}>{tierIcon}&nbsp; {tierContent}</div>

      {/* Quick stats */}
      <div className="qs-grid">
        <div className="qs"><div className="qv">${fmt(Math.round(monthly))}</div><div className="ql">Monthly Cost</div></div>
        <div className="qs"><div className="qv">${rate.toFixed(3)}</div><div className="ql">Cost per kWh</div></div>
        <div className="qs"><div className="qv">{predicted > avg ? '+' : ''}{fmt(Math.round(predicted - avg))}</div><div className="ql">vs Avg ($)</div></div>
        <div className="qs"><div className="qv">{predicted > median ? '+' : ''}{fmt(Math.round(predicted - median))}</div><div className="ql">vs Median ($)</div></div>
        <div className="qs"><div className="qv">{pct_rank.toFixed(0)}%</div><div className="ql">Percentile</div></div>
      </div>

      <hr className="hr-subtle" />

      <div className="chart-grid">
        {/* Donut */}
        <div className="chart-box">
          <h4>&#129383; Bill Breakdown (Your Inputs)</h4>
          {totalCost > 0 ? (
            <Doughnut
              data={{
                labels: ['A/C', 'Water Heating', 'Refrigerator', 'Other'],
                datasets: [{
                  data: [dolelcol, dolelwth, dolelrfg, doleloth],
                  backgroundColor: ['#38bdf8', '#818cf8', '#f472b6', '#34d399'],
                  borderColor: '#0b1120', borderWidth: 2,
                }],
              }}
              options={{
                cutout: '55%',
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (ctx) => ctx.label + ': $' + ctx.raw } },
                },
              }}
            />
          ) : (
            <div className="donut-fallback">Enter component costs to see breakdown.</div>
          )}
        </div>

        {/* Where You Stand */}
        <div className="chart-box">
          <h4>&#128205; Where You Stand</h4>
          <Bar
            data={{
              labels: hist.bins.map((b) => '$' + Math.round(b)),
              datasets: [{ data: hist.counts, backgroundColor: bgColors, borderRadius: 2 }],
            }}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { title: (ctx) => ctx[0].label, label: (ctx) => ctx.raw + ' homes' } },
              },
              scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(56,189,248,.06)' } },
              },
              animation: { duration: 600 },
            }}
          />
        </div>
      </div>

      {/* Saving tips */}
      <div className="section-divider">
        <div className="sd-line" /><div className="sd-text">&#128161; Personalised Saving Tips</div><div className="sd-line" />
      </div>
      <div className="tip-grid">
        {tips.slice(0, 3).map((t, i) => (
          <div className="tip-card" key={i}>
            <div className="tip-icon">{t.icon}</div>
            <h4>{t.title}</h4>
            <p>{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

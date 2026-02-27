import { Bar, Scatter, Line } from 'react-chartjs-2';
import { useModel } from '../context/ModelContext';
import { HOUSING_TYPES } from '../constants';

export default function DashboardTab() {
  const { dashData, dashLoaded, dashRefreshing, k } = useModel();

  if (!dashLoaded || !dashData) {
    return <div className="ibox text-center">Loading dashboard data&hellip;</div>;
  }

  const { bill_hist, box_data, scatter, pred_vs_act, correlation, summary, kComp } = dashData;

  /* Box-plot data */
  const types  = Object.keys(box_data).sort();
  const labels = types.map((t) => HOUSING_TYPES[t] ? t + ' ' + HOUSING_TYPES[t].substring(0, 12) : t);
  const q1s    = types.map((t) => box_data[t].q1);
  const q3s    = types.map((t) => box_data[t].q3);
  const meds   = types.map((t) => box_data[t].median);

  /* Scatter type colors */
  const typeColors = { 1: '#38bdf8', 2: '#818cf8', 3: '#f472b6', 4: '#34d399', 5: '#facc15' };

  /* Predicted vs Actual bounds */
  const pva = pred_vs_act;
  const lo  = Math.min(...pva.actual);
  const hi  = Math.max(...pva.actual);

  /* Summary table */
  const statCols = Object.keys(summary);
  const statRows = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];

  return (
    <>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        &#128202; Dataset Exploration &amp; Model Analysis
        {dashRefreshing && (
          <span style={{
            fontSize: '0.7rem', fontWeight: 500,
            background: 'rgba(56,189,248,.18)', color: '#38bdf8',
            padding: '2px 10px', borderRadius: '99px', letterSpacing: '0.04em',
          }}>
            Updating…
          </span>
        )}
      </h3>

      <div className="chart-grid">
        {/* 1. Bill Distribution */}
        <div className="chart-box">
          <h4>Distribution of Annual Electricity Bills</h4>
          <Bar
            data={{
              labels: bill_hist.bins.map((b) => '$' + Math.round(b)),
              datasets: [{ data: bill_hist.counts, backgroundColor: 'rgba(56,189,248,.5)', borderRadius: 2 }],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { x: { display: false }, y: { grid: { color: 'rgba(56,189,248,.06)' } } },
            }}
          />
        </div>

        {/* 2. Box plot (IQR + median line) */}
        <div className="chart-box">
          <h4>Bill by Housing Type</h4>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: 'IQR',
                  data: types.map((_, i) => [q1s[i], q3s[i]]),
                  backgroundColor: 'rgba(56,189,248,.35)',
                  borderRadius: 4,
                },
                {
                  label: 'Median',
                  data: meds,
                  type: 'line',
                  borderColor: '#f472b6',
                  borderWidth: 2,
                  pointRadius: 5,
                  pointBackgroundColor: '#f472b6',
                  fill: false,
                },
              ],
            }}
            options={{
              plugins: { legend: { labels: { color: '#e2e8f0' } } },
              scales: {
                x: { ticks: { color: 'rgba(255,255,255,.5)', font: { size: 10 } } },
                y: { grid: { color: 'rgba(56,189,248,.06)' }, title: { display: true, text: 'Bill ($)', color: 'rgba(255,255,255,.5)' } },
              },
            }}
          />
        </div>
      </div>

      <div className="chart-grid">
        {/* 3. kWh vs Bill Scatter */}
        <div className="chart-box">
          <h4>kWh vs Bill (1,500 sample)</h4>
          <Scatter
            data={{
              datasets: [{
                data: scatter.x.map((x, i) => ({ x, y: scatter.y[i] })),
                backgroundColor: scatter.type.map((t) => typeColors[t] || '#38bdf8'),
                pointRadius: 2.5,
                pointHoverRadius: 5,
              }],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { title: { display: true, text: 'Total kWh', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
                y: { title: { display: true, text: 'Bill ($)', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
              },
            }}
          />
        </div>

        {/* 4. Predicted vs Actual */}
        <div className="chart-box">
          <h4>Predicted vs Actual (test set)</h4>
          <Scatter
            data={{
              datasets: [
                {
                  label: 'Predicted vs Actual',
                  data: pva.actual.map((a, i) => ({ x: a, y: pva.predicted[i] })),
                  backgroundColor: 'rgba(56,189,248,.5)',
                  pointRadius: 2.5,
                },
                {
                  label: 'Perfect',
                  data: [{ x: lo, y: lo }, { x: hi, y: hi }],
                  type: 'line',
                  borderColor: '#f472b6',
                  borderDash: [6, 3],
                  borderWidth: 1.5,
                  pointRadius: 0,
                  fill: false,
                },
              ],
            }}
            options={{
              plugins: { legend: { labels: { color: '#e2e8f0' } } },
              scales: {
                x: { title: { display: true, text: 'Actual ($)', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
                y: { title: { display: true, text: 'Predicted ($)', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
              },
            }}
          />
        </div>
      </div>

      {/* 5. k Comparison */}
      <hr className="hr-subtle-lg" />
      <h4 className="section-heading mb-sm">&#128269; Optimal k Analysis</h4>
      <div className="chart-box chart-box-mb">
        <Line
          data={{
            labels: kComp.rows.map((r) => r.k),
            datasets: [
              { label: 'MAE ($)', data: kComp.rows.map((r) => r.mae), borderColor: '#38bdf8', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#38bdf8', fill: false, tension: 0.1 },
              { label: 'RMSE ($)', data: kComp.rows.map((r) => r.rmse), borderColor: '#818cf8', borderWidth: 2.5, borderDash: [5, 3], pointRadius: 5, pointBackgroundColor: '#818cf8', fill: false, tension: 0.1 },
            ],
          }}
          options={{
            plugins: { legend: { labels: { color: '#e2e8f0' } } },
            scales: {
              x: { title: { display: true, text: 'k (neighbours)', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
              y: { title: { display: true, text: 'Error ($)', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' } },
            },
          }}
        />
      </div>
      <div className="ibox">
        &#128208; Best k by MAE in this split is <b>k = {kComp.best_k}</b>. You are using <b>k = {k}</b>. Adjust the sidebar slider to experiment.
      </div>

      {/* 6. Correlation */}
      <h4 className="section-heading-sm">Feature Correlation with DOLLAREL</h4>
      <div className="chart-box">
        <Bar
          data={{
            labels: correlation.features,
            datasets: [{
              data: correlation.values,
              backgroundColor: correlation.values.map((v) => v > 0 ? 'rgba(56,189,248,.5)' : 'rgba(244,114,182,.5)'),
              borderRadius: 3,
            }],
          }}
          options={{
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: 'Correlation', color: 'rgba(255,255,255,.5)' }, grid: { color: 'rgba(56,189,248,.06)' }, min: -1, max: 1 },
              y: { ticks: { color: 'rgba(255,255,255,.55)', font: { size: 11 } } },
            },
          }}
        />
      </div>

      {/* 7. Summary Statistics */}
      <h4 className="section-heading-lg">Summary Statistics</h4>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Stat</th>
            {statCols.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {statRows.map((r) => (
            <tr key={r}>
              <th>{r}</th>
              {statCols.map((c) => (
                <td key={c}>{summary[c][r] !== undefined ? summary[c][r].toLocaleString() : '\u2013'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

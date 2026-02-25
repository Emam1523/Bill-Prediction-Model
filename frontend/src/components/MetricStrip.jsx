import { useModel } from '../context/ModelContext';

const fmt = (n) => Number(n).toLocaleString('en-US');

export default function MetricStrip() {
  const { metrics } = useModel();

  const m = metrics || {};
  return (
    <div className="metric-row">
      <div className="mc"><div className="v">{m.train != null ? fmt(m.train) : '\u2014'}</div><div className="l">Train Samples</div></div>
      <div className="mc"><div className="v">{m.test  != null ? fmt(m.test) : '\u2014'}</div><div className="l">Test Samples</div></div>
      <div className="mc"><div className="v">{m.mae   != null ? '$' + Math.round(m.mae) : '\u2014'}</div><div className="l">MAE</div></div>
      <div className="mc"><div className="v">{m.rmse  != null ? '$' + Math.round(m.rmse) : '\u2014'}</div><div className="l">RMSE</div></div>
      <div className="mc"><div className="v">{m.mape  != null ? m.mape.toFixed(1) + '%' : '\u2014'}</div><div className="l">Avg Error %</div></div>
      <div className="mc"><div className="v">{m.accuracy != null ? m.accuracy.toFixed(1) + '%' : '\u2014'}</div><div className="l">Accuracy</div></div>
      <div className="mc"><div className="v">{m.k     != null ? m.k : '\u2014'}</div><div className="l">k Neighbours</div></div>
    </div>
  );
}

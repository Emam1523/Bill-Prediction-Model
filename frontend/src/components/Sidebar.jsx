import { useModel } from '../context/ModelContext';

export default function Sidebar({ open }) {
  const { k, setK, splitInt, setSplitInt, split } = useModel();

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sb-header">
        <h3>&#9881;&#65039; Model Controls</h3>
        <p>Adjust parameters &amp; retrain live</p>
      </div>

      <label className="sb-label" htmlFor="k-slider">
        k &mdash; Nearest Neighbours
      </label>
      <div className="sb-slider-row">
        <input
          type="range" id="k-slider"
          min="1" max="25" step="2"
          value={k}
          title="Number of nearest neighbours (k)"
          onChange={(e) => setK(e.target.value)}
        />
        <span className="sv">{k}</span>
      </div>

      <label className="sb-label" htmlFor="split-slider">
        Training Split
      </label>
      <div className="sb-slider-row">
        <input
          type="range" id="split-slider"
          min="70" max="95" step="5"
          value={splitInt}
          title="Training data percentage"
          onChange={(e) => setSplitInt(parseInt(e.target.value, 10))}
        />
        <span className="sv">{split.toFixed(2)}</span>
      </div>

      <div className="sb-info">
        &#128202; <b>Dataset</b> RECS 2009 (EIA)<br />
        &#127968; <b>Samples</b> 12,083 US homes<br />
        &#128290; <b>Features</b> 23 inputs &rarr; 1 output<br />
        &#129504; <b>Algorithm</b> kNN Regression<br />
        &#128208; <b>Distance</b> Euclidean (min-max)<br />
        &#127919; <b>Target</b> Annual bill (USD)
      </div>
    </aside>
  );
}

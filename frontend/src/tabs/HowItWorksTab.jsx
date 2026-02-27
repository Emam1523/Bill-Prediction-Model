import { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useModel } from '../context/ModelContext';

export default function HowItWorksTab() {
  const { dashData, howLoaded, loadHowItWorks } = useModel();

  useEffect(() => {
    if (!howLoaded) loadHowItWorks();
  }, [howLoaded, loadHowItWorks]);

  const rh = dashData?.residual_hist;

  return (
    <>
      <h3>&#129504; How the Project Works</h3>
      <div className="ibox">
        This project predicts a household&rsquo;s <b>annual electricity bill</b> in US dollars using a{' '}
        <b>k-Nearest Neighbours (kNN) regression</b> algorithm trained on real survey data from{' '}
        <b>12,083 U.S. residential housing units</b>.
      </div>

      <div className="step"><div className="badge">1</div><div className="body"><h4>Data Collection</h4><p>Collected the RECS 2009 survey from the U.S. Energy Information Administration &mdash; 12,083 housing units with 935 attributes each.</p></div></div>
      <div className="step"><div className="badge">2</div><div className="body"><h4>Attribute Parsing</h4><p>Python script extracted 190 electricity-relevant columns from the raw 935-column dataset.</p></div></div>
      <div className="step"><div className="badge">3</div><div className="body"><h4>Feature Selection</h4><p>Boruta algorithm (Random Forest wrapper) in R ran 100 iterations and reduced 190 features down to the 24 most significant ones.</p></div></div>
      <div className="step"><div className="badge">4</div><div className="body"><h4>kNN Model Building</h4><p>Built a from-scratch kNN Regressor in Python. Features are min-max normalised, Euclidean distance is computed, and the average bill of k nearest neighbours is returned.</p></div></div>
      <div className="step"><div className="badge">5</div><div className="body"><h4>Train / Test Split</h4><p>90% of data (&asymp;10,900 rows) is used for training, 10% (&asymp;1,200 rows) for testing. Split is reproducible via a fixed random seed.</p></div></div>
      <div className="step"><div className="badge">6</div><div className="body"><h4>Prediction &amp; Evaluation</h4><p>For each test house, the model finds the k closest training houses and averages their bills. Accuracy is measured using MAE, RMSE, and MAPE.</p></div></div>

      <h4 className="section-heading">&#128208; Algorithm Detail</h4>
      <div className="ibox">
        <b>k-Nearest Neighbours Regression</b><br /><br />
        1. All 23 input features are <b>min-max normalised</b> to [0, 1] so no single feature dominates the distance.<br />
        2. For each new input, the <b>Euclidean distance</b> to every training sample is calculated.<br />
        3. The <b>k closest</b> training samples are selected (default k = 9).<br />
        4. The predicted bill is the <b>arithmetic mean</b> of those k neighbours&rsquo; DOLLAREL values.<br /><br />
        <b>Error Metrics:</b><br />
        &bull; <b>MAE</b> (Mean Absolute Error) &mdash; average absolute dollar difference.<br />
        &bull; <b>RMSE</b> (Root Mean Squared Error) &mdash; penalises larger errors more.<br />
        &bull; <b>MAPE</b> (Mean Absolute Percentage Error) &mdash; error as a percentage of actual bills.
      </div>

      <hr className="hr-subtle" />
      <h4 className="section-heading mb-sm">&#128201; Residual Distribution (test set)</h4>
      <div className="chart-box">
        {rh ? (
          <Bar
            data={{
              labels: rh.bins.map((b) => '$' + Math.round(b)),
              datasets: [{ data: rh.counts, backgroundColor: 'rgba(129,140,248,.5)', borderRadius: 2 }],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(56,189,248,.06)' }, title: { display: true, text: 'Count', color: 'rgba(255,255,255,.5)' } },
              },
            }}
          />
        ) : (
          <p className="text-muted text-center">Loading residual data&hellip;</p>
        )}
      </div>
      {rh && (
        <div className="ibox mt-sm">
          A residual near <b>$0</b> means a perfect prediction. Mean residual: <b>${rh.mean}</b> &mdash; no systematic over/under-prediction.
        </div>
      )}
    </>
  );
}

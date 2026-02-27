import { FEATURE_NAMES, FEATURE_DESC } from '../constants';

export default function IOTab() {
  return (
    <>
      <h3>&#128229; Input and Output</h3>
      <div className="ibox">
        The model takes <b>23 numeric input features</b> describing a U.S. residential housing unit
        and produces <b>1 numeric output</b> &mdash; the predicted annual electricity bill in whole dollars.
      </div>

      <div className="two-col">
        <div className="io-card">
          <h4>&#128229; 23 Input Features</h4>
          <ul>
            <li><b>Housing:</b> Type, Bedrooms, Bathrooms, Total Rooms, Basement, Garage Heating</li>
            <li><b>Size:</b> Total Sq Ft, Heated Sq Ft, Cooled Sq Ft</li>
            <li><b>Climate:</b> Heating Degree Days (HDD), Cooling Degree Days (CDD)</li>
            <li><b>HVAC:</b> Rooms Heated, Rooms Cooled, Central A/C Frequency, Night Temp</li>
            <li><b>Usage (kWh):</b> Total, A/C, Refrigerator, Other</li>
            <li><b>Component Costs ($):</b> A/C, Water Heating, Refrigerator, Other</li>
          </ul>
        </div>
        <div className="io-card">
          <h4>&#128228; 1 Output (Target)</h4>
          <ul>
            <li><b>DOLLAREL</b> &mdash; Total Annual Electricity Cost in whole US dollars</li>
            <li>Predicted by averaging the electricity bills of the <b>k closest</b> training homes</li>
            <li>Range in dataset: <b>$0 &ndash; $5,600+</b></li>
          </ul>
        </div>
      </div>

      <h4 className="section-heading">Full Feature Reference</h4>
      <table className="feat-table">
        <thead>
          <tr><th>#</th><th>Code</th><th>Description</th><th>Role</th></tr>
        </thead>
        <tbody>
          {FEATURE_NAMES.map((code, i) => (
            <tr key={code}>
              <td>{i + 1}</td>
              <td><b>{code}</b></td>
              <td>{FEATURE_DESC[code] || ''}</td>
              <td>{code === 'DOLLAREL' ? '\uD83C\uDFAF Target' : '\uD83D\uDCE5 Input'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ibox mt-md">
        <b>Data source:</b> RECS 2009 &mdash; Residential Energy Consumption Survey by the
        U.S. Energy Information Administration.<br />
        Original dataset has <b>935 columns &times; 12,083 rows</b>.
        After feature selection, only the <b>24 most relevant columns</b> are used.
      </div>
    </>
  );
}

const TABS = [
  { id: 'predict',   label: '\uD83D\uDD2E Predict' },
  { id: 'dashboard', label: '\uD83D\uDCCA Dashboard' },
  { id: 'io',        label: '\uD83D\uDCE5 Input / Output' },
  { id: 'how',       label: '\uD83E\uDDE0 How It Works' },
];

export default function TabBar({ active, onChange }) {
  return (
    <div className="tab-bar" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab-btn${active === t.id ? ' active' : ''}`}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import MetricStrip from './components/MetricStrip';
import TabBar from './components/TabBar';
import PredictTab from './tabs/PredictTab';
import DashboardTab from './tabs/DashboardTab';
import IOTab from './tabs/IOTab';
import HowItWorksTab from './tabs/HowItWorksTab';
import { useModel } from './context/ModelContext';

const TABS = ['predict', 'dashboard', 'io', 'how'];

export default function App() {
  const [activeTab, setActiveTab] = useState('predict');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadDashboard, loadHowItWorks } = useModel();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'how') loadHowItWorks();
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle sidebar"
      >
        &#9776;
      </button>

      <div className="app-wrap">
        <Sidebar open={sidebarOpen} />

        <main className="main">
          <Hero />
          <MetricStrip />
          <TabBar active={activeTab} onChange={handleTabChange} />

          <div className={`tab-panel${activeTab === 'predict' ? ' active' : ''}`}>
            <PredictTab />
          </div>
          <div className={`tab-panel${activeTab === 'dashboard' ? ' active' : ''}`}>
            <DashboardTab />
          </div>
          <div className={`tab-panel${activeTab === 'io' ? ' active' : ''}`}>
            <IOTab />
          </div>
          <div className={`tab-panel${activeTab === 'how' ? ' active' : ''}`}>
            <HowItWorksTab />
          </div>

          {/* Footer */}
          <div className="footer">
            ElectriBill AI &#9889; &mdash; AI Residential Electricity Bill Predictor<br />
            Built with Python, Django, Chart.js &amp; kNN from scratch &middot; RECS 2009 dataset
          </div>
        </main>
      </div>
    </>
  );
}

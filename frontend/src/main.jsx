import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import App from './App';
import { ModelProvider } from './context/ModelContext';
import './styles/global.css';

/* Register every Chart.js component we use */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

/* Chart.js global defaults (match the HTML version) */
ChartJS.defaults.color = 'rgba(255,255,255,.5)';
ChartJS.defaults.borderColor = 'rgba(56,189,248,.08)';
ChartJS.defaults.font.family = "'Inter',system-ui,sans-serif";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ModelProvider>
      <App />
    </ModelProvider>
  </React.StrictMode>,
);

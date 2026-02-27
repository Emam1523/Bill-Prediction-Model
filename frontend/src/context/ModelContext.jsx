import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api';

const Ctx = createContext(null);
export const useModel = () => useContext(Ctx);

export function ModelProvider({ children }) {
  const [k, setKRaw]           = useState(9);
  const [splitInt, setSplitInt] = useState(90);        
  const [metrics, setMetrics]   = useState(null);       
  const [dashData, setDashData] = useState(null);
  const [billHistData, setBillHistData] = useState(null);
  const [dashLoaded, setDashLoaded]     = useState(false);
  const [dashRefreshing, setDashRefreshing] = useState(false); 
  const [howLoaded, setHowLoaded]           = useState(false);

  const timerRef     = useRef(null);
  const dashSplitRef = useRef(null); 
  const dashKRef     = useRef(null);   

  const split = splitInt / 100;

  const setK = useCallback((v) => {
    let n = parseInt(v, 10);
    if (n % 2 === 0) n++;
    setKRaw(n);
  }, []);

  const trainModel = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api('/api/train', { k, split });
        setMetrics(data);

        const splitChanged = dashSplitRef.current !== null &&
                             Math.round(dashSplitRef.current * 100) !== Math.round(split * 100);
        if (splitChanged || !dashLoaded) {
          // Full reset
          setDashLoaded(false);
          setHowLoaded(false);
          dashSplitRef.current = null;
          dashKRef.current     = null;
        }
      } catch (e) {
        console.error('Train error:', e);
      }
    }, 350);
  }, [k, split, dashLoaded]);

  useEffect(() => { trainModel(); }, [trainModel]);

  useEffect(() => {
    if (!dashLoaded || dashData === null) return;
    if (dashKRef.current === k) return;             
    if (dashSplitRef.current !== null &&
        Math.round(dashSplitRef.current * 100) !== Math.round(split * 100)) return; 
    let cancelled = false;
    const refresh = async () => {
      setDashRefreshing(true);
      try {
        const dash = await api('/api/dashboard', { k, split });
        if (cancelled) return;
        dashKRef.current = k;
        setDashData((prev) => ({
          ...prev,
          pred_vs_act:   dash.pred_vs_act,
          residual_hist: dash.residual_hist,
          k:             dash.k,
        }));
        setBillHistData(dash.bill_hist);   
        setHowLoaded(false);               
      } catch (e) {
        console.error('Soft refresh error:', e);
      } finally {
        if (!cancelled) setDashRefreshing(false);
      }
    };
    refresh();
    return () => { cancelled = true; };
  }, [k, dashLoaded, dashData, split]);

  const loadDashboard = useCallback(async () => {
    if (dashLoaded && dashData) return;
    try {
      const [dash, kComp] = await Promise.all([
        api('/api/dashboard', { k, split }),
        api('/api/k-comparison', { split }),
      ]);
      dashSplitRef.current = split;
      dashKRef.current     = k;
      setBillHistData(dash.bill_hist);
      setDashData({ ...dash, kComp });
      setDashLoaded(true);
    } catch (e) {
      console.error('Dashboard error:', e);
    }
  }, [k, split, dashLoaded, dashData]);

  const loadHowItWorks = useCallback(async () => {
    if (howLoaded) return;
    try {
      const dash = await api('/api/dashboard', { k, split });
      setDashData((prev) => ({ ...prev, residual_hist: dash.residual_hist }));
      setHowLoaded(true);
    } catch (e) {
      console.error('How-it-works error:', e);
    }
  }, [k, split, howLoaded]);

  const value = {
    k, setK,
    splitInt, setSplitInt, split,
    metrics,
    dashData, dashLoaded, dashRefreshing, loadDashboard,
    billHistData, setBillHistData,
    howLoaded, loadHowItWorks,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

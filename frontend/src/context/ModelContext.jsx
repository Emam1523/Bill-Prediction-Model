import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../api';

const Ctx = createContext(null);
export const useModel = () => useContext(Ctx);

export function ModelProvider({ children }) {
  const [k, setKRaw]           = useState(9);
  const [splitInt, setSplitInt] = useState(90);         // 70-95 integer (displayed as 0.XX)
  const [metrics, setMetrics]   = useState(null);       // { train,test,mae,rmse,mape,accuracy,k,split }
  const [dashData, setDashData] = useState(null);
  const [billHistData, setBillHistData] = useState(null);
  const [dashLoaded, setDashLoaded]     = useState(false);
  const [dashRefreshing, setDashRefreshing] = useState(false); // subtle refresh — old charts stay visible
  const [howLoaded, setHowLoaded]           = useState(false);

  const timerRef     = useRef(null);
  const dashSplitRef = useRef(null);   // split value that produced the current dashData
  const dashKRef     = useRef(null);   // k value that produced the current dynamic charts

  /* Derived: split as 0.XX float */
  const split = splitInt / 100;

  /* Ensure k is always odd */
  const setK = useCallback((v) => {
    let n = parseInt(v, 10);
    if (n % 2 === 0) n++;
    setKRaw(n);
  }, []);

  /* Train the model — called on every k/split change.
     • Split change  → full dashboard reset (k-comparison must also reload)
     • k-only change → keep existing charts; soft-refresh dynamic parts only  */
  const trainModel = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api('/api/train', { k, split });
        setMetrics(data);

        const splitChanged = dashSplitRef.current !== null &&
                             Math.round(dashSplitRef.current * 100) !== Math.round(split * 100);
        if (splitChanged || !dashLoaded) {
          // Full reset — dashboard will re-fetch everything
          setDashLoaded(false);
          setHowLoaded(false);
          dashSplitRef.current = null;
          dashKRef.current     = null;
        }
        // k-only change while dashboard already loaded → soft refresh triggered
        // by the useEffect below (watches k when dashLoaded=true)
      } catch (e) {
        console.error('Train error:', e);
      }
    }, 350);
  }, [k, split, dashLoaded]);

  /* Auto-train on k or split change */
  useEffect(() => { trainModel(); }, [trainModel]);

  /* Soft-refresh dynamic charts when k changes and dashboard is already loaded */
  useEffect(() => {
    if (!dashLoaded || dashData === null) return;
    if (dashKRef.current === k) return;              // nothing new to fetch
    if (dashSplitRef.current !== null &&
        Math.round(dashSplitRef.current * 100) !== Math.round(split * 100)) return; // split changed → full reset handles it

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
        setBillHistData(dash.bill_hist);   // unchanged but cheap to set
        setHowLoaded(false);               // residual chart in How-it-works should refresh too
      } catch (e) {
        console.error('Soft refresh error:', e);
      } finally {
        if (!cancelled) setDashRefreshing(false);
      }
    };
    refresh();
    return () => { cancelled = true; };
  }, [k, dashLoaded, dashData, split]);

  /* Full dashboard load (only when dashLoaded=false) */
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

  /* Load how-it-works residual data */
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

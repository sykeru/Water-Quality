import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  query, 
  limitToLast 
} from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import { 
  Bell, Settings as SettingsIcon, Thermometer, Droplet, Waves, 
  LayoutDashboard, History, TrendingUp, FileText 
} from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QuickStatsBar from './components/QuickStatsBar';

// Pages
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings'; 
import PlaceholderPage from './pages/PlaceholderPage';
import HistoricalData from './pages/HistoricalData';
import Forecast from './pages/Forecast';
import SystemLogs from './pages/SystemLogs';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDpxdg1eDLZ12sPH1l567freEoUnIbtDwQ",
  authDomain: "rivermonitor-eecf1.firebaseapp.com",
  databaseURL: "https://rivermonitor-eecf1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rivermonitor-eecf1",
  storageBucket: "rivermonitor-eecf1.firebasestorage.app",
  messagingSenderId: "565106921492",
  appId: "1:565106921492:web:a8daa4c4e5e668937dd701",
  measurementId: "G-8F2ZJGWGP4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); 
const DB_PATH = '/RiverMonitor/Node1/History';

export default function WaterQualityDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [appMode, setAppMode] = useState('emerging');
  const [dataSource, setDataSource] = useState('real'); 
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  const [user, setUser] = useState(null);
  const notificationRef = useRef(null);
  const notificationBtnRef = useRef(null);

  const [liveValues, setLiveValues] = useState({ temp: 28.1, ph: 7.4, turbidity: 22.5 });
  const [simulationHistory, setSimulationHistory] = useState([]); 

  const [thresholds, setThresholds] = useState({
    temp: { min: 30, max: 35, enabled: true },
    ph: { min: 6.5, max: 8.5, enabled: true },
    turbidity: { min: 25, max: 40, enabled: true }
  });
  const [notifications, setNotifications] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  const [lastHeartbeat, setLastHeartbeat] = useState(0);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('disconnected'); 

  // --- HELPERS ---
  const addSystemLog = (source, data) => {
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
      source: source,
      data: data
    };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const addNotification = (text, type) => {
    const newNotif = {
      id: Date.now(),
      type: type,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 100));
  };

  // --- EFFECTS ---
  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && !notificationBtnRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dataSource === 'simulation') return;
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => setIsFirebaseConnected(!!snap.val()));
    return () => unsubscribe();
  }, [dataSource]);

  useEffect(() => {
    if (dataSource === 'simulation') {
      setDeviceStatus(isSimulationRunning ? 'online' : 'offline');
      return;
    }
    const watchdog = setInterval(() => {
      if (!isFirebaseConnected) {
        setDeviceStatus('disconnected');
      } else {
        const timeSinceLastData = Date.now() - lastHeartbeat;
        setDeviceStatus(timeSinceLastData > 10000 ? 'offline' : 'online');
      }
    }, 1000);
    return () => clearInterval(watchdog);
  }, [isFirebaseConnected, lastHeartbeat, dataSource, isSimulationRunning]);

  useEffect(() => {
    if (dataSource === 'real') {
      setSimulationHistory([]);
    }
  }, [dataSource]);

  // 4. DATA ENGINE
  useEffect(() => {
    if (dataSource === 'real') {
      if (!user) return;
      const historyRef = query(ref(db, DB_PATH), limitToLast(1));
      const unsubscribe = onValue(historyRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const keys = Object.keys(data);
          const latestEntry = data[keys[0]];
          
          const newValues = {
            temp: latestEntry.temp || 0,
            ph: latestEntry.pH || 0, 
            turbidity: latestEntry.turbidity || 0
          };
          
          setLiveValues(newValues);
          setLastHeartbeat(Date.now());
          addSystemLog('real', newValues);
        } else {
          setLiveValues({ temp: 0, ph: 0, turbidity: 0 });
        }
      });
      return () => unsubscribe();
    }

    if (dataSource === 'simulation') {
       if (!isSimulationRunning) return;

       setLiveValues(prev => prev.temp === 0 ? { temp: 25, ph: 7.5, turbidity: 10 } : prev);

       const interval = setInterval(() => {
        setLiveValues(prev => {
          const now = Date.now();
          const timeScale = now / 10000; 

          const tempBase = 26 + (Math.sin(timeScale) * 2); 
          const tempNoise = (Math.random() - 0.5) * 0.1; 
          const newTemp = Number((tempBase + tempNoise).toFixed(1));

          let phDrift = (Math.random() - 0.5) * 0.05;
          let newPh = prev.ph + phDrift;
          if (newPh > 8.0) newPh -= 0.02;
          if (newPh < 7.0) newPh += 0.02;
          newPh = Number(newPh.toFixed(2));

          let newTurb = prev.turbidity;
          if (newTurb > 5) { newTurb -= 0.5; } 
          else { newTurb += (Math.random() - 0.5) * 0.5; }
          if (Math.random() > 0.95) { newTurb += Math.random() * 10; }
          newTurb = Math.max(0, Number(newTurb.toFixed(1)));

          const newValues = { temp: newTemp, ph: newPh, turbidity: newTurb };

          if (thresholds.temp.enabled && (newTemp < thresholds.temp.min || newTemp > thresholds.temp.max)) 
             addNotification(`Temp Alert: ${newTemp}°C`, 'alert');
          
          addSystemLog('sim', newValues);
          
          setSimulationHistory(history => {
            const newHistory = [...history, { timestamp: now, ...newValues }];
            return newHistory.slice(-60); 
          });

          return newValues;
        });
      }, 2000); 
      return () => clearInterval(interval);
    }
  }, [dataSource, user, isSimulationRunning, thresholds]);

  const headerConfig = {
    title: "M.A.L.I.N.A.W.",
    desc: "Monitoring and AnaLytics of IoT Nodes for Water Quality Assessment"
  };

  const getStatusPill = () => {
    if (deviceStatus === 'online') return { bg: 'bg-emerald-500', ring: 'bg-emerald-400', label: 'System Online' };
    if (deviceStatus === 'offline') return { bg: 'bg-amber-500', ring: 'bg-amber-400', label: dataSource === 'simulation' ? 'Sim Paused' : 'Device Offline' };
    return { bg: 'bg-rose-500', ring: 'bg-rose-400', label: 'Disconnected' };
  };
  const pillStyle = getStatusPill();

  const metrics = [
    { title: "Temperature", icon: Thermometer, type: "temp", baseDataConfig: { baseValue: 28.0, volatility: 2 }, config: { currentValue: liveValues?.temp ?? 0, unit: "°C", status: "Optimal", min: 20, max: 40 } },
    { title: "pH Level", icon: Droplet, type: "ph", baseDataConfig: { baseValue: 7.8, volatility: 0.2 }, config: { currentValue: liveValues?.ph ?? 0, unit: "pH", status: "Neutral", min: 1, max: 14 } },
    { title: "Turbidity", icon: Waves, type: "turbidity", baseDataConfig: { baseValue: 25.0, volatility: 5.0 }, config: { currentValue: liveValues?.turbidity ?? 0, unit: "NTU", status: "Clear", min: 0, max: 50 } }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} deviceStatus={deviceStatus} />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER NOW RECEIVES CONFIG */}
        <Header 
          isMenuOpen={isMenuOpen} 
          setIsMenuOpen={setIsMenuOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          notifications={notifications} 
          clearNotifications={() => setNotifications([])} 
          isNotificationsOpen={isNotificationsOpen} 
          setIsNotificationsOpen={setIsNotificationsOpen}
          headerConfig={headerConfig} 
        />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            
            {/* LEFT SIDE: STATUS PILL (MOVED FROM RIGHT) */}
            <div className="flex flex-col gap-1">
               <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</h2>
               <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2 self-start">
                <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pillStyle.ring}`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${pillStyle.bg}`}></span>
                </span>
                {pillStyle.label} <span className="text-slate-300 mx-1">|</span> {dataSource === 'simulation' ? 'Simulated' : 'Real-Time'}
              </div>
            </div>

            {/* RIGHT SIDE: Can add more controls here if needed, currently empty/hidden spacer */}
            <div></div>

          </div>

          {activeTab !== 'dashboard' && <QuickStatsBar metrics={metrics} liveValues={liveValues || {temp:0, ph:0, turbidity:0}} />}

          {activeTab === 'dashboard' && (
             <Dashboard 
               metrics={metrics} 
               liveValues={liveValues || {temp: 0, ph: 0, turbidity: 0}} 
               dataSource={dataSource} 
               simulationHistory={simulationHistory} 
             />
          )}
          
          {activeTab === 'alerts' && <Alerts notifications={notifications} clearNotifications={() => setNotifications([])} />}
          
          {activeTab === 'settings' && (
            <Settings 
              appMode={appMode} setAppMode={setAppMode} 
              dataSource={dataSource} setDataSource={setDataSource} 
              thresholds={thresholds} handleThresholdChange={(p, f, v) => setThresholds(prev => ({...prev, [p]: {...prev[p], [f]: Number(v)}}))} 
            />
          )}
          
          {activeTab === 'history' && <HistoricalData dataSource={dataSource} />}
          {activeTab === 'forecast' && <Forecast dataSource={dataSource} />}
          {activeTab === 'systemlogs' && (
            <SystemLogs 
              logs={systemLogs} 
              dataSource={dataSource} 
              isSimulationRunning={isSimulationRunning}
              setIsSimulationRunning={setIsSimulationRunning}
            />
          )}
          {['advisory'].includes(activeTab) && <PlaceholderPage activeTab={activeTab} />}
        </main>
      </div>
    </div>
  );
}
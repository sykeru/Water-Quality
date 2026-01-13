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
import { Thermometer, Droplet, Waves } from 'lucide-react';

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

// Utils
import { determineStatus } from './utils/helpers';

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

const DB_HISTORY_PATH = '/RiverMonitor/History';
const DB_FORECAST_PATH = '/RiverMonitor/Forecasts/data';

const getTimestampFromId = (id) => {
  try {
    const PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    const timeChars = id.substring(0, 8);
    let timestamp = 0;
    for (let i = 0; i < 8; i++) {
      timestamp = timestamp * 64 + PUSH_CHARS.indexOf(timeChars.charAt(i));
    }
    return timestamp;
  } catch (e) {
    return 0; 
  }
};

// --- DEFAULT SETTINGS ---
const DEFAULT_THRESHOLDS = {
  temp: { min: 30, max: 35, mode: 'out', enabled: true },
  ph: { min: 6.5, max: 8.5, mode: 'out', enabled: true },
  turbidity: { min: 25, max: 40, mode: 'out', enabled: true }
};

export default function WaterQualityDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // App Mode State
  const [appMode, setAppMode] = useState('elective'); 

  const [dataSource, setDataSource] = useState('real'); 
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [user, setUser] = useState(null);
  
  // Data States
  const [liveValues, setLiveValues] = useState({ temp: 0, ph: 0, turbidity: 0 });
  const [historyData, setHistoryData] = useState([]); 
  // Initialize as undefined to distinguish between "Loading" and "Empty"
  const [forecastData, setForecastData] = useState(undefined); 
  const [dashboardSimData, setDashboardSimData] = useState([]); 

  // --- PERSISTENT SETTINGS STATE ---
  const [thresholds, setThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('river_monitor_thresholds');
      return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
    } catch (e) {
      console.error("Failed to load settings:", e);
      return DEFAULT_THRESHOLDS;
    }
  });

  // Use Ref to ensure event listeners always access the LATEST thresholds
  const thresholdsRef = useRef(thresholds);

  useEffect(() => {
    thresholdsRef.current = thresholds;
    try {
      localStorage.setItem('river_monitor_thresholds', JSON.stringify(thresholds));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [thresholds]);
  
  const [notifications, setNotifications] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [lastHeartbeat, setLastHeartbeat] = useState(0);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('disconnected'); 

  // --- ALERT ENGINE ---
  const checkAlerts = (values) => {
    if (!values) return;
    
    const newAlerts = [];
    const now = Date.now();
    const currentConfig = thresholdsRef.current; // Access latest config via ref

    const checkParam = (param, value, label) => {
        const config = currentConfig[param];
        if (!config || !config.enabled) return;

        let triggered = false;
        let message = "";

        if (config.mode === 'out') {
            if (value < config.min) {
                triggered = true;
                message = `${label} is too low (${value}). Minimum allowed is ${config.min}.`;
            } else if (value > config.max) {
                triggered = true;
                message = `${label} is too high (${value}). Maximum allowed is ${config.max}.`;
            }
        } else {
            if (value >= config.min && value <= config.max) {
                triggered = true;
                message = `${label} is within target range (${value}).`;
            }
        }

        if (triggered) {
            newAlerts.push({
                id: `${param}-${now}`,
                type: 'warning',
                title: `${label} Alert`,
                message: message,
                timestamp: now,
                read: false
            });
        }
    };

    checkParam('temp', values.temp, "Temperature");
    checkParam('ph', values.ph, "pH Level");
    checkParam('turbidity', values.turbidity, "Turbidity");

    if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts, ...prev].slice(0, 50)); 
    }
  };

  // --- AUTH ---
  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- CONNECTION STATUS ---
  useEffect(() => {
    if (dataSource === 'simulation') {
      setDeviceStatus(isSimulationRunning ? 'online' : 'offline');
      return;
    }
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => setIsFirebaseConnected(!!snap.val()));
    
    const watchdog = setInterval(() => {
      if (!isFirebaseConnected) {
        setDeviceStatus('disconnected');
      } else {
        const timeSinceLastData = Date.now() - lastHeartbeat;
        setDeviceStatus(timeSinceLastData > 20000 ? 'offline' : 'online');
      }
    }, 1000);

    return () => {
        unsubscribe();
        clearInterval(watchdog);
    }
  }, [dataSource, isSimulationRunning, isFirebaseConnected, lastHeartbeat]);

  // --- 1. FORECAST DATA (ALWAYS FETCH) ---
  // Runs once on mount. Ensures Forecast page always has data.
  useEffect(() => {
    console.log("☁️ Connecting to Forecast Data...");
    const forecastRef = ref(db, DB_FORECAST_PATH);
    const unsubscribe = onValue(forecastRef, (snapshot) => {
      if (snapshot.exists()) {
        setForecastData(snapshot.val());
      } else {
        setForecastData(null); // Explicitly null if empty
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. REAL HISTORY/LIVE DATA ---
  useEffect(() => {
    if (dataSource === 'real') {
      console.log("🔌 Connecting to History Data...");
      const historyQuery = query(ref(db, DB_HISTORY_PATH), limitToLast(500));
      
      const unsubscribeHistory = onValue(historyQuery, (snapshot) => {
        if (snapshot.exists()) {
          const dataObj = snapshot.val();
          
          const parsedData = Object.keys(dataObj).map(key => {
            const entry = dataObj[key];
            const rawTemp = entry.temperature ?? entry.temp ?? entry.Temp ?? entry.Temperature ?? 0;
            const rawPh = entry.pH ?? entry.ph ?? entry.PH ?? 0;
            const rawTurb = entry.turbidity ?? entry.turb ?? entry.Turbidity ?? entry.ntu ?? entry.NTU ?? 0;

            let timeVal = getTimestampFromId(key);
            if (timeVal < 1600000000000) { 
               if (entry.device_time) {
                   const t = Number(entry.device_time);
                   timeVal = t < 10000000000 ? Date.now() : t; 
               } else if (entry.timestamp) {
                   timeVal = Number(entry.timestamp);
               } else {
                   timeVal = Date.now();
               }
            }

            return {
              id: key,
              timestamp: timeVal,
              temp: Number(rawTemp),
              ph: Number(rawPh),
              turbidity: Number(rawTurb),
              raw: entry
            };
          });

          parsedData.sort((a, b) => a.timestamp - b.timestamp);
          setHistoryData(parsedData);
          setSystemLogs(parsedData); 

          if (parsedData.length > 0) {
            const latest = parsedData[parsedData.length - 1];
            const newLive = {
              temp: latest.temp,
              ph: latest.ph,
              turbidity: latest.turbidity
            };
            setLiveValues(newLive);
            setLastHeartbeat(Date.now());
            checkAlerts(newLive);
          }
        }
      });

      return () => {
        unsubscribeHistory();
      };
    }
  }, [dataSource]);

  // --- SIMULATION LOGIC ---
  useEffect(() => {
    if (dataSource !== 'simulation') return;

    let simulationInterval;
    
    // 1. INITIALIZE IF EMPTY (Fixed: Removed historyData check)
    if (dashboardSimData.length === 0) {
        console.log("Creating Initial Simulation Data...");
        const initialQueue = [];
        let lastTemp = 28.0, lastPh = 7.5, lastTurb = 15.0;

        for (let i = 0; i < 49; i++) {
            lastTemp += (Math.random() - 0.5);
            lastPh += (Math.random() - 0.5) * 0.2;
            lastTurb += (Math.random() - 0.5) * 5;

            lastTemp = Math.max(20, Math.min(35, lastTemp));
            lastPh = Math.max(6, Math.min(9, lastPh));
            lastTurb = Math.max(0, Math.min(100, lastTurb));

            initialQueue.push({
                temp: Number(lastTemp.toFixed(2)),
                ph: Number(lastPh.toFixed(2)),
                turbidity: Number(lastTurb.toFixed(2))
            });
        }
        setDashboardSimData(initialQueue);
        setLiveValues(initialQueue[24]);
    }

    // 2. RUN SIMULATION LOOP
    if (isSimulationRunning && dashboardSimData.length > 0) {
        simulationInterval = setInterval(() => {
            const now = Date.now();

            setDashboardSimData(prevQueue => {
                if (prevQueue.length < 25) return prevQueue;

                const currentCenter = prevQueue[24];
                
                // Base Random Walk
                let tempChange = (Math.random() - 0.5);
                let phChange = (Math.random() - 0.5) * 0.2;
                let turbChange = (Math.random() - 0.5) * 5;

                // --- FLUCTUATION INJECTION (20% Chance) ---
                if (Math.random() < 0.2) {
                    const type = Math.random();
                    if (type < 0.33) {
                        tempChange += (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.5); 
                    } else if (type < 0.66) {
                        phChange += (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.0);
                    } else {
                        turbChange += (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 60);
                    }
                }

                // Apply changes
                const newTemp = Math.max(20, Math.min(35, currentCenter.temp + tempChange));
                const newPh = Math.max(6, Math.min(10, currentCenter.ph + phChange));
                const newTurb = Math.max(0, Math.min(500, currentCenter.turbidity + turbChange));

                const newLivePoint = {
                    temp: Number(newTemp.toFixed(2)),
                    ph: Number(newPh.toFixed(2)),
                    turbidity: Number(newTurb.toFixed(2))
                };
                
                const lastFuture = prevQueue[prevQueue.length - 1];
                const newFuturePoint = {
                    temp: Number((lastFuture.temp + (Math.random() - 0.5)).toFixed(2)),
                    ph: Number((lastFuture.ph + (Math.random() - 0.5) * 0.1).toFixed(2)),
                    turbidity: Number((lastFuture.turbidity + (Math.random() - 0.5) * 2).toFixed(2))
                };

                const shiftedAll = prevQueue.slice(1); 
                shiftedAll.push(newFuturePoint);       
                shiftedAll[24] = newLivePoint; 

                setLiveValues(newLivePoint);
                checkAlerts(newLivePoint);

                setHistoryData(prevHist => {
                    const realTimePoint = {
                        id: `sim_${now}`,
                        timestamp: now,
                        ...newLivePoint
                    };
                    const newHist = [...prevHist, realTimePoint];
                    if (newHist.length > 500) newHist.shift();
                    return newHist;
                });

                return shiftedAll;
            });
        }, 5000); 
    }

    return () => {
        if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [dataSource, isSimulationRunning, dashboardSimData.length]); 

  const handleClearData = () => {
    if (dataSource === 'simulation') {
        console.log("🧹 Clearing Simulation Data...");
        setHistoryData([]);
        setDashboardSimData([]);
        setSystemLogs([]); 
        setLiveValues({ temp: 0, ph: 0, turbidity: 0 });
    }
  };

  const headerOptions = {
    elective: {
      title: "Water Quality Monitoring",
      desc: "An IoT-based real-time river water quality monitoring system leveraging microcontroller devices, and descriptive and predictive data analytics in selected rivers in Indang, Cavite"
    },
    embedded: { 
      title: "M.A.L.I.N.A.W.",
      desc: "Monitoring and AnaLytics of IoT Nodes for Water Quality Assessment"
    }
  };

  const currentHeaderConfig = headerOptions[appMode] || headerOptions.elective;

  const getStatusPill = () => {
    if (deviceStatus === 'online') return { bg: 'bg-emerald-500', ring: 'bg-emerald-400', label: 'System Online' };
    if (deviceStatus === 'offline') return { bg: 'bg-amber-500', ring: 'bg-amber-400', label: dataSource === 'simulation' ? 'Sim Paused' : 'Device Offline' };
    return { bg: 'bg-rose-500', ring: 'bg-rose-400', label: 'Disconnected' };
  };
  const pillStyle = getStatusPill();

  const metrics = [
    { title: "Temperature", icon: Thermometer, type: "temp", baseDataConfig: { baseValue: 28.0, volatility: 2 }, config: { currentValue: liveValues?.temp ?? 0, unit: "°C", status: determineStatus('temp', liveValues?.temp ?? 0), min: 20, max: 40 } },
    { title: "pH Level", icon: Droplet, type: "ph", baseDataConfig: { baseValue: 7.8, volatility: 0.2 }, config: { currentValue: liveValues?.ph ?? 0, unit: "pH", status: determineStatus('ph', liveValues?.ph ?? 0), min: 1, max: 14 } },
    { title: "Turbidity", icon: Waves, type: "turbidity", baseDataConfig: { baseValue: 25.0, volatility: 5.0 }, config: { currentValue: liveValues?.turbidity ?? 0, unit: "NTU", status: determineStatus('turbidity', liveValues?.turbidity ?? 0), min: 0, max: 100 } }
  ];

  const lastTimestamp = historyData.length > 0 ? historyData[historyData.length - 1].timestamp : Date.now();

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} deviceStatus={deviceStatus} />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <Header 
          isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} 
          activeTab={activeTab} setActiveTab={setActiveTab} 
          notifications={notifications} clearNotifications={() => setNotifications([])} 
          isNotificationsOpen={isNotificationsOpen} setIsNotificationsOpen={setIsNotificationsOpen}
          headerConfig={currentHeaderConfig} 
        />
        
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
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
          </div>

          {activeTab !== 'dashboard' && <QuickStatsBar metrics={metrics} liveValues={liveValues || {temp:0, ph:0, turbidity:0}} />}

          {activeTab === 'dashboard' && (
            <Dashboard 
              metrics={metrics} 
              liveValues={liveValues} 
              dataSource={dataSource} 
              historyData={dataSource === 'simulation' ? dashboardSimData : historyData}
              forecastData={forecastData}
              lastUpdated={lastTimestamp}
            />
          )}
          {activeTab === 'alerts' && <Alerts notifications={notifications} clearNotifications={() => setNotifications([])} />}
          
          {activeTab === 'settings' && (
            <Settings 
                appMode={appMode} 
                setAppMode={setAppMode} 
                dataSource={dataSource} 
                setDataSource={setDataSource} 
                thresholds={thresholds} 
                onSaveThresholds={setThresholds} 
                isSimulationRunning={isSimulationRunning}
                toggleSimulation={() => setIsSimulationRunning(!isSimulationRunning)}
            />
          )}
          
          {activeTab === 'history' && <HistoricalData dataSource={dataSource} historyData={historyData} />}
          
          {activeTab === 'forecast' && (
            <Forecast 
              dataSource={dataSource} 
              forecastData={forecastData} 
              lastTimestamp={lastTimestamp} 
            />
          )}
          
          {activeTab === 'systemlogs' && (
            <SystemLogs 
                logs={dataSource === 'simulation' ? historyData : systemLogs} 
                dataSource={dataSource} 
                isSimulationRunning={isSimulationRunning} 
                setIsSimulationRunning={setIsSimulationRunning} 
                liveValues={liveValues} 
                setLiveValues={setLiveValues}
                forecastData={forecastData} // PASSED HERE
                onClearData={handleClearData} 
            />
          )}
          {['advisory'].includes(activeTab) && <PlaceholderPage activeTab={activeTab} />}
        </main>
      </div>
    </div>
  );
}
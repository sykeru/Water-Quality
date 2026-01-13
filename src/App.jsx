import React, { useState, useEffect } from 'react';
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

// --- MAGIC DECODER: Extracts Timestamp from Firebase Push ID ---
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
  const [forecastData, setForecastData] = useState(null);
  
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

  // --- AUTH & SETUP ---
  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));
    return onAuthStateChanged(auth, setUser);
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
        setDeviceStatus(timeSinceLastData > 20000 ? 'offline' : 'online');
      }
    }, 1000);
    return () => clearInterval(watchdog);
  }, [isFirebaseConnected, lastHeartbeat, dataSource, isSimulationRunning]);

  // --- DATA ENGINE (MODIFIED TO FIX TURBIDITY) ---
  useEffect(() => {
    if (dataSource === 'real') {
      console.log("🔌 Connecting to Firebase...");

      const historyQuery = query(ref(db, DB_HISTORY_PATH), limitToLast(500));
      
      const unsubscribeHistory = onValue(historyQuery, (snapshot) => {
        if (snapshot.exists()) {
          const dataObj = snapshot.val();
          
          const parsedData = Object.keys(dataObj).map(key => {
            const entry = dataObj[key];
            
            // 1. Parsing Values with expanded casing/naming support
            // Check for Temperature variations
            const rawTemp = entry.temperature ?? entry.temp ?? entry.Temp ?? entry.Temperature ?? 0;
            
            // Check for pH variations
            const rawPh = entry.pH ?? entry.ph ?? entry.PH ?? 0;
            
            // FIX: Extended check for Turbidity variations & REMOVED the > 1000 limit check
            const rawTurb = entry.turbidity ?? entry.turb ?? entry.Turbidity ?? entry.ntu ?? entry.NTU ?? 0;

            // --- 2. FIXED TIMESTAMP LOGIC ---
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
              turbidity: Number(rawTurb), // Now passes raw value even if high
              raw: entry
            };
          });

          parsedData.sort((a, b) => a.timestamp - b.timestamp);
          setHistoryData(parsedData);
          setSystemLogs(parsedData); 

          if (parsedData.length > 0) {
            const latest = parsedData[parsedData.length - 1];
            
            // Debugging: Check the console to see the exact values arriving
            console.log("Latest Live Values:", latest);

            setLiveValues({
              temp: latest.temp,
              ph: latest.ph,
              turbidity: latest.turbidity
            });
            setLastHeartbeat(Date.now());
          }
        }
      });

      const forecastRef = ref(db, DB_FORECAST_PATH);
      const unsubscribeForecast = onValue(forecastRef, (snapshot) => {
        if (snapshot.exists()) {
          setForecastData(snapshot.val());
        }
      });

      return () => {
        unsubscribeHistory();
        unsubscribeForecast();
      };
    }
  }, [dataSource]);

  // --- DYNAMIC HEADER CONFIGURATION ---
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
    { title: "Turbidity", icon: Waves, type: "turbidity", baseDataConfig: { baseValue: 25.0, volatility: 5.0 }, config: { currentValue: liveValues?.turbidity ?? 0, unit: "NTU", status: determineStatus('turbidity', liveValues?.turbidity ?? 0), min: 0, max: 3000 } } // Updated Max for raw values
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} activeTab={activeTab} setActiveTab={setActiveTab} deviceStatus={deviceStatus} />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Pass Dynamic Header Config */}
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
              historyData={historyData}
              forecastData={forecastData}
            />
          )}
          {activeTab === 'alerts' && <Alerts notifications={notifications} clearNotifications={() => setNotifications([])} />}
          
          {/* Pass AppMode props to Settings */}
          {activeTab === 'settings' && (
            <Settings 
                appMode={appMode} 
                setAppMode={setAppMode} 
                dataSource={dataSource} 
                setDataSource={setDataSource} 
                thresholds={thresholds} 
                handleThresholdChange={(p, f, v) => setThresholds(prev => ({...prev, [p]: {...prev[p], [f]: Number(v)}}))} 
                isSimulationRunning={isSimulationRunning}
                toggleSimulation={() => setIsSimulationRunning(!isSimulationRunning)}
            />
          )}
          
          {activeTab === 'history' && <HistoricalData dataSource={dataSource} historyData={historyData} />}
          
          {activeTab === 'forecast' && (
            <Forecast 
              dataSource={dataSource} 
              forecastData={forecastData} 
              lastTimestamp={historyData.length > 0 ? historyData[historyData.length - 1].timestamp : Date.now()} 
            />
          )}
          
          {activeTab === 'systemlogs' && <SystemLogs logs={systemLogs} dataSource={dataSource} isSimulationRunning={isSimulationRunning} setIsSimulationRunning={setIsSimulationRunning} liveValues={liveValues} setLiveValues={setLiveValues} />}
          {['advisory'].includes(activeTab) && <PlaceholderPage activeTab={activeTab} />}
        </main>
      </div>
    </div>
  );
}
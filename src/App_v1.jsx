import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ReferenceLine,
  Tooltip
} from 'recharts';
import { 
  Bell, 
  Settings, 
  Menu, 
  ChevronDown, 
  Thermometer, 
  Droplet, 
  Waves,
  X,                 
  LayoutDashboard,   
  History,           
  TrendingUp,        
  FileText,     
  Home,
  Check,
  Save,
  Trash2,
  AlertTriangle,
  Info,
  Filter,       
  ArrowUp,      
  ArrowDown,    
  Calendar,     
  CheckCircle,
  Lightbulb,
  Cpu,          // Icon for Mode
  BookOpen      // Icon for Mode
} from 'lucide-react';

// --- GLOBAL HELPERS ---

const gradientStops = {
  temp: [{ p: 0.0, r: 0, g: 0, b: 139, a: 1 }, { p: 1.0, r: 255, g: 0, b: 0, a: 1 }],
  ph: [
    { p: 0.00, r: 176, g: 28, b: 43, a: 1 }, { p: 0.10, r: 221, g: 58, b: 51, a: 1 },
    { p: 0.20, r: 224, g: 202, b: 49, a: 1 }, { p: 0.30, r: 53, g: 132, b: 68, a: 1 },
    { p: 0.40, r: 31, g: 156, b: 209, a: 1 }, { p: 0.48, r: 32, g: 142, b: 196, a: 1 },
    { p: 0.58, r: 36, g: 31, b: 94, a: 1 }, { p: 0.66, r: 94, g: 42, b: 136, a: 1 },
    { p: 0.74, r: 135, g: 36, b: 132, a: 1 }, { p: 1.00, r: 135, g: 36, b: 132, a: 1 }
  ],
  turbidity: [
    { p: 0.00, r: 236, g: 231, b: 202, a: 0.15 }, { p: 0.50, r: 170, g: 121, b: 65, a: 1.0 }, { p: 1.00, r: 36, g: 17, b: 2, a: 1.0 }
  ]
};

const getColorFromGradient = (value, min, max, stops) => {
  const safeValue = Math.min(Math.max(value, min), max);
  const percentage = (safeValue - min) / (max - min);
  for (let i = 0; i < stops.length - 1; i++) {
    if (percentage >= stops[i].p && percentage <= stops[i+1].p) {
      const range = stops[i+1].p - stops[i].p;
      const dist = (percentage - stops[i].p) / range;
      const r = Math.round(stops[i].r + (stops[i+1].r - stops[i].r) * dist);
      const g = Math.round(stops[i].g + (stops[i+1].g - stops[i].g) * dist);
      const b = Math.round(stops[i].b + (stops[i+1].b - stops[i].b) * dist);
      const a = stops[i].a + (stops[i+1].a - stops[i].a) * dist;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  const last = stops[stops.length - 1];
  return `rgba(${last.r}, ${last.g}, ${last.b}, ${last.a})`;
};

const getStatusStyle = (status) => {
  const s = status.toLowerCase();
  if (['optimal', 'neutral', 'clear', 'normal', 'online', 'excellent', 'good'].includes(s)) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (['cloudy', 'warning', 'fair'].includes(s)) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
};

const getDescriptiveAnalysis = (type, value) => {
  if (type === 'temp') {
    if (value < 20) return "Water is colder than usual. Metabolic rates of aquatic life may slow down.";
    if (value > 30) return "Temperature is high. Risk of lower dissolved oxygen levels.";
    return "Temperature is ideal. Optimal conditions for biological activity.";
  }
  if (type === 'ph') {
    if (value < 6.5) return "Water is acidic. Potential risk of toxicity to sensitive species.";
    if (value > 8.5) return "Water is alkaline. Check for excessive algae growth.";
    return "pH balance is stable. Safe environment for most aquatic organisms.";
  }
  if (type === 'turbidity') {
    if (value > 25) return "Water clarity is poor. Suspended particles may block sunlight.";
    if (value > 10) return "Moderate turbidity detected. Minor sediment disturbance possible.";
    return "Water is clear. Excellent light penetration for photosynthesis.";
  }
  return "Analyzing sensor data...";
};

// --- COMPONENTS ---

const CircularGauge = ({ value, min, max, type, unit, status }) => {
  const radius = 80;
  const stroke = 12;
  const center = 110;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const safeValue = Math.min(Math.max(value, min), max);
  const normalizedValue = (safeValue - min) / (max - min);
  const currentAngle = startAngle + (normalizedValue * totalAngle);

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  const indicatorPos = polarToCartesian(center, center, radius, currentAngle);
  const minLabelPos = polarToCartesian(center, center, radius + 25, startAngle);
  const maxLabelPos = polarToCartesian(center, center, radius + 25, endAngle);

  const renderAngularGradient = () => {
    const stops = gradientStops[type];
    const firstObj = stops[0];
    const lastObj = stops[stops.length - 1];
    const firstColor = `rgba(${firstObj.r},${firstObj.g},${firstObj.b},${firstObj.a})`;
    const lastColor = `rgba(${lastObj.r},${lastObj.g},${lastObj.b},${lastObj.a})`;
    let gradientString = stops.map(s => `rgba(${s.r},${s.g},${s.b},${s.a}) ${s.p * 270}deg`).join(', ');
    gradientString += `, ${lastColor} 285deg, transparent 285deg, transparent 345deg, ${firstColor} 345deg`;
    
    const gradientStyle = { width: '220px', height: '220px', background: `conic-gradient(from 225deg at 50% 50%, ${gradientString})` };
    const maskId = `mask-${type}-bar`;
    const maskEndAngle = type === 'temp' ? currentAngle : endAngle;

    return (
      <>
        <defs><mask id={maskId}><path d={describeArc(center, center, radius, startAngle, maskEndAngle)} fill="none" stroke="white" strokeWidth={stroke} strokeLinecap="round" /></mask></defs>
        <foreignObject x="0" y="0" width="220" height="220" mask={`url(#${maskId})`}><div style={gradientStyle} /></foreignObject>
      </>
    );
  };

  const getDotColor = () => getColorFromGradient(value, min, max, gradientStops[type]);
  const statusClasses = getStatusStyle(status);

  return (
    <div className="relative flex flex-col items-center justify-center -mt-4">
      <svg width="220" height="180" viewBox="0 0 220 180" className="overflow-visible">
        <defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/></filter></defs>
        {type === 'temp' && (<path d={describeArc(center, center, radius, startAngle, endAngle)} fill="none" stroke="#e2e8f0" strokeWidth={stroke} strokeLinecap="round" />)}
        {renderAngularGradient()}
        <text x={minLabelPos.x} y={minLabelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-400">{min}</text>
        <text x={maxLabelPos.x} y={maxLabelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-400">{max}</text>
        <circle cx={indicatorPos.x} cy={indicatorPos.y} r="12" fill={getDotColor()} stroke="white" strokeWidth="3" filter="url(#shadow)" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute top-[85px] text-center">
        <div className="text-5xl font-bold text-slate-800 tracking-tight">{Number(value).toFixed(1)}</div>
        <div className="text-sm font-semibold text-slate-400 mt-1 uppercase">{unit}</div>
        <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block border ${statusClasses}`}>{status}</div>
      </div>
    </div>
  );
};

const ChartControls = ({ timeframe, setTimeframe, showHist, setShowHist, showFcst, setShowFcst }) => {
  return (
    <div className="flex flex-col items-center gap-3 mb-4 border-t border-slate-50 pt-4 mt-2 w-full">
      <div className="flex bg-slate-100 p-0.5 rounded-lg w-full justify-center">
        {['24h', '7d', '4w'].map((tf) => (
          <button key={tf} onClick={() => setTimeframe(tf)} className={`flex-1 px-3 py-1 text-xs font-bold rounded-md transition-all text-center ${timeframe === tf ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{tf.toUpperCase()}</button>
        ))}
      </div>
      <div className="flex gap-4 w-full justify-center">
        <button onClick={() => setShowHist(!showHist)} className={`flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${showHist ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}><span className={`w-2 h-2 rounded-full ${showHist ? 'bg-blue-600' : 'bg-slate-300'}`}></span> Actual</button>
        <button onClick={() => setShowFcst(!showFcst)} className={`flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${showFcst ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-400 border-slate-200'}`}><span className={`w-2 h-2 rounded-full border-2 ${showFcst ? 'border-orange-500 border-dashed' : 'border-slate-300 border-dashed'}`}></span> Forecast</button>
      </div>
    </div>
  );
};

const MetricCard = ({ title, icon: Icon, baseDataConfig, config, type, liveData }) => {
  const [showHist, setShowHist] = useState(true);
  const [showFcst, setShowFcst] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const generateData = () => {
      const data = [];
      let points = timeframe === '24h' ? ['-24h', '-18h', '-12h', '-6h', 'Now', '+6h', '+12h', '+18h', '+24h'] : ['Day 1', 'Day 2', 'Now', 'Next'];
      let forecastValue = liveData;
      const volatility = baseDataConfig.volatility;
      const splitIndex = points.findIndex(p => p === 'Now');

      points.forEach((point, index) => {
        let entry = { name: point };
        const dist = index - splitIndex;
        const forecastNoise = (Math.random() - 0.5) * volatility * 0.8;
        entry.fcst = liveData + (dist * (volatility * 0.1)) + forecastNoise;
        if (index <= splitIndex) {
            const actualNoise = index === splitIndex ? 0 : (Math.random() - 0.5) * volatility;
            entry.hist = liveData + (dist * (volatility * 0.1)) + actualNoise;
        } else {
            entry.hist = null;
        }
        data.push(entry);
      });
      return data;
    };
    setChartData(generateData());
  }, [timeframe, liveData, baseDataConfig]);

  const xAxisTickFormatter = (value) => value;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize font-semibold">{entry.name}:</span>
              <span>{Number(entry.value).toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-700 font-bold text-lg">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-xl"><Icon className="text-slate-400 w-5 h-5" /></div>
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        <CircularGauge value={liveData} min={config.min} max={config.max} type={type} unit={config.unit} status={config.status} />
      </div>

      <div className="mt-8 mb-2 text-center min-h-[40px] flex items-end justify-center">
        <p className="text-sm font-medium text-slate-600 leading-relaxed px-2">
          {getDescriptiveAnalysis(type, liveData)}
        </p>
      </div>

      <ChartControls timeframe={timeframe} setTimeframe={setTimeframe} showHist={showHist} setShowHist={setShowHist} showFcst={showFcst} setShowFcst={setShowFcst} />
      
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={true} tickFormatter={xAxisTickFormatter} tick={{fill: '#94a3b8', fontSize: 10}} interval={0} />
            <YAxis axisLine={false} tickLine={false} width={25} tick={{fill: '#94a3b8', fontSize: 10}} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x="Now" stroke="#cbd5e1" strokeDasharray="3 3" />
            {showFcst && <Line type="monotone" dataKey="fcst" name="Forecast" stroke="#f97316" strokeWidth={2} strokeDasharray="4 4" strokeOpacity={0.6} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />}
            {showHist && <Line type="monotone" dataKey="hist" name="Actual" stroke="#2563eb" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const QuickStatsBar = ({ metrics, liveValues }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-top-10 fade-in duration-500 ease-out">
      {metrics.map((metric, index) => {
        const val = liveValues[metric.type] || metric.config.currentValue;
        const dynamicColor = getColorFromGradient(val, metric.config.min, metric.config.max, gradientStops[metric.type]);
        const statusClasses = getStatusStyle(metric.config.status);

        return (
          <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
             <div className="w-5 h-5 rounded-full shadow-inner border-[1px] border-white flex-shrink-0" style={{ backgroundColor: dynamicColor, boxShadow: `0 2px 4px -1px ${dynamicColor}40` }}></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metric.title}</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-bold text-slate-800">{Number(val).toFixed(1)}</span>
                 <span className="text-xs font-semibold text-slate-400">{metric.config.unit}</span>
               </div>
             </div>
             <div className="ml-auto"><span className={`text-sm font-bold px-3 py-1.5 rounded-full border shadow-sm ${statusClasses}`}>{metric.config.status}</span></div>
          </div>
        );
      })}
    </div>
  );
};

const WaterQualityIndexCard = ({ liveValues }) => {
  const tempScore = Math.max(0, 100 - Math.abs(liveValues.temp - 25) * 2);
  const phScore = Math.max(0, 100 - Math.abs(liveValues.ph - 7) * 15);
  const turbScore = Math.max(0, 100 - liveValues.turbidity * 1.5);
  
  const wqi = Math.round((tempScore + phScore + turbScore) / 3);
  
  let statusText = "Excellent";
  let statusDesc = "The water quality is suitable for all uses, including drinking and aquatic life. All parameters are within optimal ranges.";
  let solidBarColor = "bg-emerald-500";
  
  if (wqi < 80) {
    statusText = "Good";
    statusDesc = "Water quality is generally good but may have minor deviations in one parameter.";
    solidBarColor = "bg-teal-400";
  }
  if (wqi < 60) {
    statusText = "Fair";
    statusDesc = "Water quality is acceptable for irrigation but requires treatment for drinking.";
    solidBarColor = "bg-amber-400";
  }
  if (wqi < 40) {
    statusText = "Poor";
    statusDesc = "Significant pollution detected. Water requires major treatment.";
    solidBarColor = "bg-rose-500";
  }

  return (
    <div className="col-span-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
      <div className="flex flex-col items-center justify-center min-w-[150px]">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Water Quality Index</h3>
        <div className="text-7xl font-extrabold text-slate-800 tracking-tighter">{wqi}</div>
        <div className="text-sm font-bold text-slate-400 mt-1">WQI</div>
      </div>
      
      <div className="flex-grow w-full">
        <div className="flex justify-between items-end mb-2">
          <span className="text-lg font-bold text-slate-700">{statusText}</span>
          <span className="text-xs font-semibold text-slate-400">{wqi}/100</span>
        </div>
        
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full ${solidBarColor} transition-all duration-1000 ease-out rounded-full`} 
            style={{ width: `${wqi}%` }}
          ></div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed">
          {statusDesc}
        </p>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function WaterQualityDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  
  // NEW: App Mode State (default: emerging)
  const [appMode, setAppMode] = useState('emerging');

  // REFS
  const notificationRef = useRef(null);
  const notificationBtnRef = useRef(null);
  const filterMenuRef = useRef(null);

  // STATE
  const [liveValues, setLiveValues] = useState({ temp: 28.1, ph: 7.4, turbidity: 22.5 });
  const [thresholds, setThresholds] = useState({
    temp: { min: 30, max: 35, enabled: true },
    ph: { min: 6.5, max: 8.5, enabled: true },
    turbidity: { min: 25, max: 40, enabled: true }
  });
  const [notifications, setNotifications] = useState([
    { id: 1705280000000, type: 'info', text: 'System connected successfully', time: '10:00 AM' }, 
    { id: Date.now(), type: 'info', text: 'Dashboard initialized', time: 'Just now' }
  ]);
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'all', 
    sortOrder: 'desc', 
    types: { alert: true, info: true, warning: true, success: true },
    params: { temp: true, ph: true, turbidity: true, system: true },
    isOpen: false 
  });

  const prevValuesRef = useRef(liveValues);

  // CLICK OUTSIDE
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && !notificationBtnRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterConfig(prev => ({ ...prev, isOpen: false }));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SIMULATION
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveValues(prev => {
        const newTemp = Math.max(20, Math.min(50, prev.temp + (Math.random() - 0.5) * 2));
        const newPh = Math.max(1, Math.min(14, prev.ph + (Math.random() - 0.5) * 0.5));
        const newTurb = Math.max(0, Math.min(50, prev.turbidity + (Math.random() - 0.5) * 5));
        const newValues = { temp: newTemp, ph: newPh, turbidity: newTurb };

        if (thresholds.temp.enabled && newValues.temp !== prev.temp) {
          if (newValues.temp >= thresholds.temp.min && newValues.temp <= thresholds.temp.max) addNotification(`Temperature Alert: ${newValues.temp.toFixed(1)}°C`, 'alert');
        }
        if (thresholds.ph.enabled && newValues.ph !== prev.ph) {
          if (newValues.ph >= thresholds.ph.min && newValues.ph <= thresholds.ph.max) addNotification(`pH Alert: ${newValues.ph.toFixed(1)}`, 'alert');
        }
        if (thresholds.turbidity.enabled && newValues.turbidity !== prev.turbidity) {
          if (newValues.turbidity >= thresholds.turbidity.min && newValues.turbidity <= thresholds.turbidity.max) addNotification(`Turbidity Alert: ${newValues.turbidity.toFixed(1)} NTU`, 'alert');
        }

        prevValuesRef.current = newValues;
        return newValues;
      });
    }, 4000); 
    return () => clearInterval(interval);
  }, [thresholds]); 

  const addNotification = (text, type) => {
    const newNotif = {
      id: Date.now(),
      type: type,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 100));
  };

  const handleThresholdChange = (param, field, val) => {
    setThresholds(prev => ({
      ...prev,
      [param]: { ...prev[param], [field]: Number(val) }
    }));
  };

  const clearNotifications = () => setNotifications([]);

  // FILTER LOGIC
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter(n => {
      if (!filterConfig.types[n.type]) return false;
      let isSystem = !n.text.includes('Temperature') && !n.text.includes('pH') && !n.text.includes('Turbidity');
      if (n.text.includes('Temperature') && !filterConfig.params.temp) return false;
      if (n.text.includes('pH') && !filterConfig.params.ph) return false;
      if (n.text.includes('Turbidity') && !filterConfig.params.turbidity) return false;
      if (isSystem && !filterConfig.params.system) return false;
      const now = Date.now();
      const diff = now - n.id;
      const oneDay = 24 * 60 * 60 * 1000;
      if (filterConfig.timeRange === '24h' && diff > oneDay) return false;
      if (filterConfig.timeRange === '7d' && diff > 7 * oneDay) return false;
      if (filterConfig.timeRange === '30d' && diff > 30 * oneDay) return false;
      return true;
    });
    return filtered.sort((a, b) => filterConfig.sortOrder === 'desc' ? b.id - a.id : a.id - b.id);
  }, [notifications, filterConfig]);

  const toggleFilterType = (key) => setFilterConfig(prev => ({ ...prev, types: { ...prev.types, [key]: !prev.types[key] } }));
  const toggleFilterParam = (key) => setFilterConfig(prev => ({ ...prev, params: { ...prev.params, [key]: !prev.params[key] } }));

  // MENU ITEMS
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'advisory', label: 'Smart Advisory', icon: FileText },
    { id: 'alerts', label: 'Alerts & Events', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // PAGE INFO
  const pageInfo = {
    history: { title: "Historical Data", desc: "Review past sensor readings and identify long-term trends." },
    forecast: { title: "Forecast Analytics", desc: "Predictive modeling for upcoming water quality conditions." },
    advisory: { title: "Smart Advisory", desc: "AI-driven insights and actionable recommendations." },
    alerts: { title: "Alerts & Events", desc: "A complete log of system alerts and status updates." },
    settings: { title: "Settings", desc: "Configure alert thresholds and device parameters." },
  };

  const metrics = [
    { title: "Temperature", icon: Thermometer, type: "temp", baseDataConfig: { baseValue: 28.0, volatility: 2 }, config: { currentValue: liveValues.temp, unit: "°C", status: "Optimal", min: 20, max: 50 } },
    { title: "pH Level", icon: Droplet, type: "ph", baseDataConfig: { baseValue: 7.8, volatility: 0.2 }, config: { currentValue: liveValues.ph, unit: "pH", status: "Neutral", min: 1, max: 14 } },
    { title: "Turbidity", icon: Waves, type: "turbidity", baseDataConfig: { baseValue: 25.0, volatility: 5.0 }, config: { currentValue: liveValues.turbidity, unit: "NTU", status: "Clear", min: 0, max: 50 } }
  ];

  // HEADER CONFIG BASED ON MODE
  const headerConfig = appMode === 'elective' 
    ? {
        title: "Real-Time Water Quality Monitoring System",
        desc: "An IoT-based real-time river water quality monitoring system everaging microcontroller devices, and descriptive and predictive data analytics for rivers."
      }
    : {
        title: "M.A.L.I.N.A.W.",
        desc: "Monitoring and AnaLytics of IoT Nodes for Water Quality Assessment"
      };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative bg-white w-72 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">MENU</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-500" /></button>
            </div>
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }} className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'}`}>
                    <ItemIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto border-t border-slate-100 pt-6">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Device Status</div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-sm font-bold text-emerald-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Menu className="w-6 h-6 text-slate-600" /></button>
          <div className="relative">
            <button onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)} className="group cursor-pointer flex items-center gap-2 font-bold text-slate-800 text-lg hover:text-blue-600 transition-colors focus:outline-none">
              Device 1 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDeviceMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDeviceMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-blue-600 font-medium"><span>Device 1</span><Check className="w-4 h-4" /></div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <button 
            ref={notificationBtnRef}
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
            className={`p-2 rounded-full relative transition-colors ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
          </button>

          {isNotificationsOpen && (
            <div ref={notificationRef} className="absolute top-14 right-10 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 z-50">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                <h3 className="font-bold text-slate-700">Notifications</h3>
                <span onClick={clearNotifications} className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">Clear all</span>
              </div>
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No new notifications</p> : 
                  notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-b border-slate-50 last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                    <div><p className="text-sm font-medium text-slate-700 leading-tight">{notif.text}</p><p className="text-xs text-slate-400 mt-1">{notif.time}</p></div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <button onClick={() => {setActiveTab('alerts'); setIsNotificationsOpen(false);}} className="text-xs text-center text-blue-600 font-semibold pt-2 hover:underline">View all history</button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' ? (
            <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-slate-100 text-slate-800 rounded-full hover:bg-slate-200 transition-colors" title="Return to Dashboard"><Home className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors" title="Go to Settings"><Settings className="w-5 h-5" /></button>
          )}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">JD</div>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className={`font-extrabold text-slate-900 tracking-tight uppercase ${appMode === 'elective' ? 'text-2xl' : 'text-3xl'}`}>
              {headerConfig.title}
            </h1>
            <p className={`text-slate-500 mt-1 ${appMode === 'elective' ? 'text-xs max-w-2xl' : 'text-base'}`}>
              {headerConfig.desc}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-600 flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
            System Online <span className="text-slate-300 mx-1">|</span> Updated just now
          </div>
        </div>

        {activeTab !== 'dashboard' && (
          <>
            <QuickStatsBar metrics={metrics} liveValues={liveValues} />
            <div className="mb-6 animate-in fade-in slide-in-from-left-4">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">{pageInfo[activeTab]?.title}</h2>
              <p className="text-slate-500 mt-1">{pageInfo[activeTab]?.desc}</p>
            </div>
          </>
        )}

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {metrics.map((metric, index) => (
              <div key={index} className="h-[600px]">
                <MetricCard title={metric.title} icon={metric.icon} baseDataConfig={metric.baseDataConfig} config={metric.config} type={metric.type} liveData={liveValues[metric.type]} />
              </div>
            ))}
            <WaterQualityIndexCard liveValues={liveValues} />
          </div>
        )}

        {/* ALERTS & EVENTS PAGE */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 gap-4">
              <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                {['all', '24h', '7d', '30d'].map(tf => (
                  <button key={tf} onClick={() => setFilterConfig(prev => ({...prev, timeRange: tf}))} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterConfig.timeRange === tf ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 relative">
                <div className="relative" ref={filterMenuRef}>
                  <button onClick={() => setFilterConfig(prev => ({...prev, isOpen: !prev.isOpen}))} className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${filterConfig.isOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <Filter className="w-4 h-4" /> Filter
                  </button>
                  {filterConfig.isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-20 animate-in fade-in slide-in-from-top-2">
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">By Type</p>
                        {Object.keys(filterConfig.types).map(type => (
                          <div key={type} className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => toggleFilterType(type)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterConfig.types[type] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{filterConfig.types[type] && <Check className="w-3 h-3 text-white" />}</div>
                            <span className="text-xs font-semibold capitalize text-slate-700">{type}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">By Parameter</p>
                        {Object.keys(filterConfig.params).map(param => (
                          <div key={param} className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => toggleFilterParam(param)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterConfig.params[param] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{filterConfig.params[param] && <Check className="w-3 h-3 text-white" />}</div>
                            <span className="text-xs font-semibold capitalize text-slate-700">{param}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setFilterConfig(prev => ({...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'}))} className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  {filterConfig.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />} Sort
                </button>
                <button onClick={clearNotifications} className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Filter className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No notifications match your filters.</p></div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div key={notif.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : notif.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800">{notif.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {notif.time}</p>
                    </div>
                    <div className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-full">{notif.type.toUpperCase()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {activeTab === 'settings' && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. APP MODE SELECTOR */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-2 bg-blue-50 rounded-full"><Cpu className="w-6 h-6 text-blue-500" /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">System Mode</h3>
                  <p className="text-sm text-slate-500">Select the operational context for the dashboard.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div 
                  onClick={() => setAppMode('emerging')}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${appMode === 'emerging' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">Embedded/Emerging</span>
                    {appMode === 'emerging' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                </div>

                <div 
                  onClick={() => setAppMode('elective')}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${appMode === 'elective' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">Elective</span>
                    {appMode === 'elective' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ALERT THRESHOLDS */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div><h3 className="text-xl font-bold text-slate-800">Alert Thresholds</h3><p className="text-sm text-slate-500 mt-1">Receive notifications when readings fall WITHIN these ranges.</p></div>
                <div className="p-2 bg-amber-50 rounded-full"><Bell className="w-6 h-6 text-amber-500" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Thermometer className="w-4 h-4 text-slate-400" /> Temperature</div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.temp.min} onChange={(e) => handleThresholdChange('temp', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.temp.max} onChange={(e) => handleThresholdChange('temp', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Droplet className="w-4 h-4 text-slate-400" /> pH Level</div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.ph.min} onChange={(e) => handleThresholdChange('ph', 'min', e.target.value)} step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.ph.max} onChange={(e) => handleThresholdChange('ph', 'max', e.target.value)} step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Waves className="w-4 h-4 text-slate-400" /> Turbidity</div>
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.turbidity.min} onChange={(e) => handleThresholdChange('turbidity', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                    <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.turbidity.max} onChange={(e) => handleThresholdChange('turbidity', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end"><button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"><Save className="w-4 h-4" /> Save Changes</button></div>
            </div>
          </div>
        )}

        {!['dashboard', 'settings', 'alerts'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-96 text-center bg-white rounded-3xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
               {activeTab === 'history' && <History className="w-10 h-10 text-slate-400" />}
               {activeTab === 'forecast' && <TrendingUp className="w-10 h-10 text-slate-400" />}
               {activeTab === 'advisory' && <FileText className="w-10 h-10 text-slate-400" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-700 capitalize">Coming Soon</h2>
            <p className="text-slate-500 mt-2">Data will appear here once sensors are active.</p>
          </div>
        )}
      </main>
    </div>
  );
}
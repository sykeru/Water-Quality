import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Download, Play, Pause, RefreshCw, Check, Zap, Lightbulb } from 'lucide-react';

const getStepSize = (range) => {
  switch(range) {
    case '1h': return 60 * 1000;
    case '24h': return 30 * 60 * 1000;
    case '7d': return 4 * 60 * 60 * 1000;
    case '30d': return 12 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
};

const createDataPoint = (dateObj) => {
  const timeVal = dateObj.getTime();
  const baseTemp = 25 + Math.sin(timeVal / 10000000) * 5; 
  const basePh = 7.5 + Math.cos(timeVal / 5000000) * 0.5;
  const baseTurb = 15 + Math.random() * 5;
  const wqi = Math.max(0, 100 - (Math.abs(baseTemp - 25) + Math.abs(basePh - 7) * 10 + baseTurb / 2));

  return {
    id: timeVal,
    timestamp: dateObj.toISOString(),
    displayTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
    fullDate: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}),
    temp: Number((baseTemp + Math.random()).toFixed(1)),
    ph: Number((basePh + (Math.random() * 0.2)).toFixed(2)),
    turbidity: Number((baseTurb + Math.random() * 2).toFixed(1)),
    wqi: Math.round(wqi)
  };
};

const generateInitialData = (range, customStart, customEnd) => {
  const data = [];
  const now = new Date();
  const step = getStepSize(range);
  let points = 50; 
  let endTime = now.getTime();
  
  if (range === 'custom') {
    if (!customStart || !customEnd) return [];
    const start = new Date(customStart).getTime();
    const end = new Date(customEnd).getTime();
    endTime = end;
    const totalDuration = end - start;
    const calcStep = totalDuration / 50;
    for (let i = 0; i < 50; i++) {
      const time = new Date(start + (i * calcStep));
      data.push(createDataPoint(time));
    }
    return data;
  }

  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(endTime - (i * step));
    data.push(createDataPoint(time));
  }
  return data;
};

export default function HistoricalData({ dataSource }) {
  const [range, setRange] = useState('24h');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isLive, setIsLive] = useState(true);
  const [data, setData] = useState([]);

  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: true, turbidity: true });

  useEffect(() => {
    // Stop if Real mode
    if (dataSource === 'real') {
        setData([]);
        return;
    }

    const initData = generateInitialData(range, customStart, customEnd);
    setData(initData);
    if (range === 'custom') setIsLive(false);
    else setIsLive(true);
  }, [range, customStart, customEnd, dataSource]);

  useEffect(() => {
    if (!isLive || range === 'custom' || dataSource === 'real') return;
    const intervalId = setInterval(() => {
      setData(currentData => {
        if (currentData.length === 0) return currentData;
        const lastPoint = currentData[currentData.length - 1];
        const lastTime = new Date(lastPoint.timestamp).getTime();
        const step = getStepSize(range);
        const newTime = new Date(lastTime + step);
        const newPoint = createDataPoint(newTime);
        const newData = [...currentData.slice(1), newPoint];
        return newData;
      });
    }, 2000); 
    return () => clearInterval(intervalId);
  }, [isLive, range, dataSource]);

  const handleExport = () => {
    const headers = ["Timestamp", "Temp (C)", "pH", "Turbidity (NTU)", "WQI"];
    const csvContent = [
      headers.join(","),
      ...data.map(row => [
        row.timestamp, row.temp, row.ph, row.turbidity, row.wqi
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `water_quality_data_${range}.csv`;
    link.click();
  };

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dateStr = payload[0].payload.fullDate;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{dateStr}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize font-semibold">{entry.name}:</span>
              <span className="font-mono">{Number(entry.value).toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="lg:col-span-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            Historical Data
            {isLive && range !== 'custom' && dataSource === 'simulation' && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">Real-time overview trends & detailed logs.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {['1h', '24h', '7d', '30d', 'custom'].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {r === 'custom' ? 'Custom' : `Last ${r.toUpperCase()}`}
              </button>
            ))}
          </div>
          {range !== 'custom' && dataSource === 'simulation' && (
            <button onClick={() => setIsLive(!isLive)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isLive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {isLive ? 'Live Update' : 'Paused'}
            </button>
          )}
          {range === 'custom' && (
            <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
              <input type="datetime-local" className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-blue-500" onChange={(e) => setCustomStart(e.target.value)} />
              <span className="self-center text-slate-400">-</span>
              <input type="datetime-local" className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-blue-500" onChange={(e) => setCustomEnd(e.target.value)} />
              <button onClick={() => setRange('custom')} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><RefreshCw className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Parameters</h3>
          <div className="space-y-2">
            {[
              { id: 'temp', label: 'Temperature', color: 'bg-blue-500', border: 'border-blue-200', activeBg: 'bg-blue-50' },
              { id: 'ph', label: 'pH Level', color: 'bg-emerald-500', border: 'border-emerald-200', activeBg: 'bg-emerald-50' },
              { id: 'turbidity', label: 'Turbidity', color: 'bg-amber-500', border: 'border-amber-200', activeBg: 'bg-amber-50' }
            ].map(item => (
              <div key={item.id} onClick={() => toggleParam(item.id)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${visibleParams[item.id] ? `${item.activeBg} ${item.border} shadow-sm` : 'border-slate-100 hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className={`text-sm font-semibold ${visibleParams[item.id] ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                </div>
                {visibleParams[item.id] && <Check className="w-4 h-4 text-slate-700" />}
              </div>
            ))}
          </div>
        </div>

        {/* INSIGHTS */}
        {dataSource === 'simulation' ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Key Insights
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start text-xs text-slate-600 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span><span><strong>Stability:</strong> pH levels remained within the optimal range (7.2 - 7.6) for 95% of the selected period.</span></li>
              <li className="flex gap-3 items-start text-xs text-slate-600 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span><span><strong>Cycles:</strong> Temperature showed a consistent diurnal cycle with slight peaks recorded around 14:00 daily.</span></li>
              <li className="flex gap-3 items-start text-xs text-slate-600 leading-relaxed"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span><span><strong>Variance:</strong> Turbidity spikes correlated with the 2 recent rainfall events detected in the system logs.</span></li>
            </ul>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-50">
             <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-slate-400" /> Key Insights</h3>
             <p className="text-xs text-slate-400 italic">None</p>
          </div>
        )}
      </div>

      {/* GRAPH */}
      <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[400px]">
        {data.length > 0 ? (
            <div className="w-full h-[400px]">
                <h3 className="text-lg font-bold text-slate-700 mb-6">Overview Trends</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayTime" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} minTickGap={40} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} domain={['auto', 'auto']} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    {visibleParams.temp && <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" animationDuration={500} isAnimationActive={false} />}
                    {visibleParams.ph && <Area type="monotone" dataKey="ph" name="pH Level" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPh)" isAnimationActive={false} />}
                    {visibleParams.turbidity && <Area type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#f59e0b" strokeWidth={3} fill="none" isAnimationActive={false} />}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="text-slate-400 font-medium italic text-sm">No data available</div>
        )}
      </div>

      {/* TABLE */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-700">Detailed Logs</h3>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                {['Timestamp', 'Temperature', 'pH Level', 'Turbidity', 'WQI'].map((h) => (
                  <th key={h} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? [...data].reverse().map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-600 font-mono">{row.fullDate}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{row.temp}°C</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{row.ph}</td>
                  <td className="p-4 text-sm font-bold text-slate-800">{row.turbidity} NTU</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${row.wqi > 80 ? 'bg-emerald-100 text-emerald-700' : row.wqi > 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {row.wqi}
                    </span>
                  </td>
                </tr>
              )) : (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No logs available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
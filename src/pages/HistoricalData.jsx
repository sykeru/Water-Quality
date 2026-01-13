import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Zap, Check, Table as TableIcon, Play, Pause } from 'lucide-react';

export default function HistoricalData({ dataSource, historyData }) {
  const [range, setRange] = useState('24h');
  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: true, turbidity: true });
  
  // --- LIVE DATA CONTROLS ---
  const [isLive, setIsLive] = useState(true);
  const [frozenDataset, setFrozenDataset] = useState([]);

  const activeDataset = isLive ? historyData : frozenDataset;

  const toggleLive = () => {
    if (isLive) {
      setFrozenDataset(historyData); 
      setIsLive(false);
    } else {
      setIsLive(true);
    }
  };

  // --- DATA FILTERING ENGINE ---
  const displayData = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) return [];
    
    // If range is 'all', return everything
    if (range === 'all') {
         return activeDataset.map(item => ({
            ...item,
            displayTime: new Date(item.timestamp).toLocaleString(),
            fullDate: new Date(item.timestamp).toLocaleString()
        }));
    }

    const latestTime = activeDataset[activeDataset.length - 1].timestamp;
    let cutoff = latestTime;
    
    if (range === '24h') cutoff = latestTime - (24 * 60 * 60 * 1000);
    if (range === '7d') cutoff = latestTime - (7 * 24 * 60 * 60 * 1000);
    if (range === '30d') cutoff = latestTime - (30 * 24 * 60 * 60 * 1000);

    return activeDataset
      .filter(item => item.timestamp >= cutoff)
      .map(item => ({
        ...item,
        displayTime: range === '24h' 
          ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullDate: new Date(item.timestamp).toLocaleString()
      }));

  }, [activeDataset, range]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  // Calculate dynamic colspan for the empty state row
  const activeColCount = 1 + (visibleParams.temp ? 1 : 0) + (visibleParams.ph ? 1 : 0) + (visibleParams.turbidity ? 1 : 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize font-semibold">{entry.name}:</span>
              <span className="font-mono">{Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HEADER */}
      <div className="lg:col-span-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            Historical Data
            {dataSource === 'real' && (
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">Review past sensor readings and identify trends.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
                onClick={toggleLive}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isLive 
                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                }`}
            >
                {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isLive ? "Pause Live Data" : "Resume Live Data"}
            </button>

            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            {[
                { label: '24h', key: '24h' },
                { label: '7d', key: '7d' },
                { label: '30d', key: '30d' },
                { label: 'All', key: 'all' }
            ].map((item) => (
                <button 
                key={item.key} 
                onClick={() => setRange(item.key)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase whitespace-nowrap ${
                    range === item.key 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                >
                {item.label}
                </button>
            ))}
            </div>
        </div>
      </div>

      {/* 2. LEFT COLUMN: PARAMETERS */}
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
      </div>

      {/* 3. CHART COLUMN */}
      <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
          {displayData.length > 0 ? (
              <div className="flex-1 w-full min-h-0 flex flex-col">
                  <div className="flex justify-between items-center mb-6 flex-none">
                      <h3 className="text-lg font-bold text-slate-700">Overview Trends</h3>
                      {!isLive && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 animate-pulse">
                              ⏸ Data Paused
                          </span>
                      )}
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="displayTime" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} minTickGap={40} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} domain={['auto', 'auto']} width={30} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        
                        {visibleParams.temp && <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />}
                        {visibleParams.ph && <Area type="monotone" dataKey="ph" name="pH Level" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPh)" isAnimationActive={false} />}
                        {visibleParams.turbidity && <Area type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#f59e0b" strokeWidth={3} fill="none" isAnimationActive={false} />}
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </div>
          ) : (
             <div className="flex items-center justify-center flex-1 h-full">
               <div className="text-slate-400 font-medium italic text-sm">Waiting for database connection...</div>
             </div>
          )}
      </div>

      {/* 4. UPDATED DATASET TABLE (DYNAMIC COLUMNS) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <TableIcon className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-800">Dataset View</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                {displayData.length} Records found
            </span>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Timestamp</th>
                        {visibleParams.temp && <th className="px-4 py-3">Temperature (°C)</th>}
                        {visibleParams.ph && <th className="px-4 py-3">pH Level</th>}
                        {visibleParams.turbidity && <th className="px-4 py-3 rounded-tr-lg">Turbidity (NTU)</th>}
                    </tr>
                </thead>
                <tbody>
                    {displayData.length > 0 ? (
                        [...displayData].reverse().map((row) => (
                            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                    {row.fullDate}
                                </td>
                                
                                {visibleParams.temp && (
                                    <td className="px-4 py-3 text-blue-600 font-mono">
                                        {row.temp.toFixed(2)}
                                    </td>
                                )}
                                
                                {visibleParams.ph && (
                                    <td className="px-4 py-3 text-emerald-600 font-mono">
                                        {row.ph.toFixed(2)}
                                    </td>
                                )}
                                
                                {visibleParams.turbidity && (
                                    <td className="px-4 py-3 text-amber-600 font-mono">
                                        {row.turbidity.toFixed(2)}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={activeColCount} className="px-4 py-8 text-center text-slate-400 italic">
                                No data available for this time range.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}
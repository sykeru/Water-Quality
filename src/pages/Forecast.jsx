import React, { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Sliders, Zap, Check, Play, Pause, Lightbulb } from 'lucide-react';

const generateForecastData = (range, simulationParams, currentNow) => {
  const data = [];
  let points = 24;
  let interval = 60 * 60 * 1000;

  if (range === '1h') { points = 60; interval = 60 * 1000; }
  else if (range === '24h') { points = 24; interval = 60 * 60 * 1000; }
  else if (range === '7d') { points = 84; interval = 2 * 60 * 60 * 1000; }
  else if (range === '30d') { points = 60; interval = 12 * 60 * 60 * 1000; }

  const startOffsetPoints = 5; 
  const startTime = currentNow.getTime() - (startOffsetPoints * interval);

  for (let i = 0; i < points + startOffsetPoints; i++) {
    const time = new Date(startTime + (i * interval));
    const isFuture = time.getTime() > currentNow.getTime();
    const progress = Math.max(0, (i - startOffsetPoints) / points); 

    let baseTemp = 28 + Math.sin(i * 0.3) * 2; 
    let basePh = 7.5 + Math.cos(i * 0.2) * 0.4;
    let baseTurb = 15 + (Math.sin(i * 0.5) * 5) + 5;

    if (isFuture) {
      baseTemp += simulationParams.ambientTemp * 0.5; 
      baseTemp -= simulationParams.rainfall * 0.2;
      baseTurb += simulationParams.rainfall * 3.5;
      basePh -= simulationParams.rainfall * 0.05;
      baseTurb += simulationParams.pollution * 4.0;
      basePh -= simulationParams.pollution * 0.2;
    }

    const uncertainty = isFuture ? (progress * 1.5) + 0.2 : 0;
    const noise = (Math.random() - 0.5) * 0.3;

    const valTemp = Number((baseTemp + noise).toFixed(1));
    const valPh = Number((basePh + (noise * 0.1)).toFixed(2));
    const valTurb = Number((baseTurb + noise * 2).toFixed(1));

    data.push({
      time: time.toISOString(),
      displayTime: range === '1h' ? time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                   range === '24h' ? time.toLocaleTimeString([], {hour: '2-digit'}) : 
                   time.toLocaleDateString([], {month: 'short', day: 'numeric'}),
      isFuture: isFuture,
      temp_actual: !isFuture ? valTemp : null,
      ph_actual: !isFuture ? valPh : null,
      turb_actual: !isFuture ? valTurb : null,
      temp_forecast: isFuture || i === startOffsetPoints - 1 ? valTemp : null,
      ph_forecast: isFuture || i === startOffsetPoints - 1 ? valPh : null,
      turb_forecast: isFuture || i === startOffsetPoints - 1 ? valTurb : null,
      temp_range: isFuture ? [Number((valTemp - uncertainty).toFixed(1)), Number((valTemp + uncertainty).toFixed(1))] : null,
      ph_range: isFuture ? [Number((valPh - (uncertainty * 0.1)).toFixed(2)), Number((valPh + (uncertainty * 0.1)).toFixed(2))] : null,
      turb_range: isFuture ? [Number((valTurb - (uncertainty * 2)).toFixed(1)), Number((valTurb + (uncertainty * 2)).toFixed(1))] : null,
    });
  }
  return data;
};

export default function Forecast({ dataSource }) {
  const [range, setRange] = useState('24h');
  const [isLive, setIsLive] = useState(true);
  const [currentNow, setCurrentNow] = useState(new Date());

  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: false, turb: false });
  const [simParams, setSimParams] = useState({ ambientTemp: 0, rainfall: 0, pollution: 0 });

  useEffect(() => {
    if (!isLive || dataSource === 'real') return; // Stop clock if real
    const interval = setInterval(() => setCurrentNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isLive, dataSource]);

  const data = useMemo(() => {
    if (dataSource === 'real') return []; // Return empty data for Real mode
    return generateForecastData(range, simParams, currentNow);
  }, [range, simParams, currentNow, dataSource]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => {
            if (entry.dataKey.includes('range') || entry.value == null) return null;
            return (
              <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="capitalize font-semibold">{entry.name.replace('_actual', '').replace('_forecast', '')}:</span>
                <span className="font-mono">{Number(entry.value).toFixed(2)}</span>
              </div>
            );
          })}
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
            Predictive Analytics
            {isLive && dataSource === 'simulation' && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">Real-time simulation & forecasting.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {['1h', '24h', '7d', '30d'].map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Next {r.toUpperCase()}</button>
            ))}
             <button disabled className="px-4 py-2 rounded-lg text-xs font-bold text-slate-300 cursor-not-allowed">Custom</button>
          </div>
          {dataSource === 'simulation' && (
            <button onClick={() => setIsLive(!isLive)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${isLive ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {isLive ? 'Live Update' : 'Paused'}
            </button>
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
              { id: 'turb', label: 'Turbidity', color: 'bg-amber-500', border: 'border-amber-200', activeBg: 'bg-amber-50' }
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

        {/* INSIGHTS - HIDE IF REAL MODE */}
        {dataSource === 'simulation' ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> AI Forecast
            </h3>
            <div className="space-y-4">
               <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 leading-snug">
                 <strong>Trend Alert:</strong> Temperature is projected to rise by 0.5°C over the next 4 hours due to simulated ambient heat.
               </div>
               <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800 leading-snug">
                 <strong>Warning:</strong> Turbidity instability expected if rainfall intensity exceeds level 5 in the simulator.
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-50">
             <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-slate-400" /> AI Forecast</h3>
             <p className="text-xs text-slate-400 italic">None</p>
          </div>
        )}

        
      </div>

      {/* CHART COLUMN */}
      <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center">
        {data.length > 0 ? (
            <>
                <div className="w-full flex justify-end items-center gap-6 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <div className="flex items-center gap-2"><span className="w-8 h-0 border-t-2 border-slate-400"></span> Historical</div>
                <div className="flex items-center gap-2"><span className="w-8 h-0 border-t-2 border-dashed border-slate-400"></span> Forecast</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-200"></span> Variance</div>
                </div>
                <div className="flex-grow w-full h-full min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gradPh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gradTurb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayTime" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={data.find(d => d.isFuture)?.displayTime} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'NOW', fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />

                    {visibleParams.temp && (
                        <>
                        <Area type="monotone" dataKey="temp_range" fill="url(#gradTemp)" stroke="none" />
                        <Line type="monotone" dataKey="temp_actual" name="Temperature" stroke="#3b82f6" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="temp_forecast" name="Temperature Forecast" stroke="#3b82f6" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                        </>
                    )}
                    {visibleParams.ph && (
                        <>
                        <Area type="monotone" dataKey="ph_range" fill="url(#gradPh)" stroke="none" />
                        <Line type="monotone" dataKey="ph_actual" name="pH Level" stroke="#10b981" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="ph_forecast" name="pH Forecast" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                        </>
                    )}
                    {visibleParams.turb && (
                        <>
                        <Area type="monotone" dataKey="turb_range" fill="url(#gradTurb)" stroke="none" />
                        <Line type="monotone" dataKey="turb_actual" name="Turbidity" stroke="#f59e0b" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="turb_forecast" name="Turbidity Forecast" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                        </>
                    )}
                    </ComposedChart>
                </ResponsiveContainer>
                </div>
            </>
        ) : (
            <div className="text-slate-400 font-medium italic text-sm">No data available</div>
        )}
      </div>
    </div>
  );
}
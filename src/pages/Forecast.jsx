import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Table as TableIcon, Loader2 } from 'lucide-react';

export default function Forecast({ dataSource, forecastData, lastTimestamp = Date.now() }) {
  const [activeInterval, setActiveInterval] = useState('hourly_24h');
  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: false, turb: false });

  // --- DATA PROCESSING ENGINE ---
  const data = useMemo(() => {
    // Check for explicit undefined to handle loading vs empty
    if (!forecastData || !forecastData['Surface Temperature']) return [];

    const tempNode = forecastData['Surface Temperature']?.[activeInterval];
    const phNode = forecastData['pH']?.[activeInterval];
    const turbNode = forecastData['Turbidity']?.[activeInterval];

    if (!tempNode) return [];

    const indices = Object.keys(tempNode).sort((a,b) => Number(a) - Number(b));

    return indices.map(i => {
      const index = Number(i);
      let displayLabel = `+${index+1}`; 
      
      let timeOffset = 0;
      if (activeInterval.includes('hourly')) {
          displayLabel += 'h';
          timeOffset = (index + 1) * 3600000;
      } else {
          displayLabel += 'd';
          timeOffset = (index + 1) * 86400000;
      }

      const futureDate = new Date(lastTimestamp + timeOffset);
      
      const fullDateStr = futureDate.toLocaleString([], {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: activeInterval.includes('hourly') ? '2-digit' : undefined,
          minute: activeInterval.includes('hourly') ? '2-digit' : undefined,
      });

      return {
        id: i,
        name: displayLabel,
        fullDate: fullDateStr, 
        temp_forecast: tempNode[i] ? Number(tempNode[i]) : null,
        ph_forecast: phNode && phNode[i] ? Number(phNode[i]) : null,
        turb_forecast: turbNode && turbNode[i] ? Number(turbNode[i]) : null,
      };
    });
  }, [forecastData, activeInterval, lastTimestamp]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  // --- LOADING STATE ---
  // If forecastData is explicitly undefined, we are connecting.
  const isLoading = forecastData === undefined;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dateStr = payload[0].payload.fullDate;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
            Forecast: <span className="text-violet-600">{dateStr}</span> ({label})
          </p>
          {payload.map((entry, index) => {
            if (entry.value == null) return null;
            return (
              <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="capitalize font-semibold">{entry.name}:</span>
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
      
      {/* 1. HEADER */}
      <div className="lg:col-span-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            Predictive Analytics
            {dataSource === 'real' && (
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
            )}
            {dataSource === 'simulation' && (
               <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                 Simulated Time
               </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">Projected trends based on historical data patterns.</p>
        </div>
        
        {/* INTERVAL CONTROLS */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {[
            { label: 'Next 24H', key: 'hourly_24h' },
            { label: 'Next 7D', key: 'daily_7d' },
            { label: 'Next 30D', key: 'daily_30d' }
          ].map((item) => (
            <button 
              key={item.key} 
              onClick={() => setActiveInterval(item.key)} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeInterval === item.key 
                ? 'bg-white text-violet-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. CHART COLUMN (FULL WIDTH) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-400 animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                <span className="text-sm font-bold">Connecting to Database...</span>
            </div>
        ) : data.length > 0 ? (
            <div className="flex-1 w-full min-h-0 flex flex-col">
              
              {/* CHART HEADER with BUTTONS */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 flex-none">
                  <h3 className="text-lg font-bold text-slate-700">Forecast Trends</h3>

                  {/* PARAMETER TOGGLES (Inside Chart Header) */}
                  <div className="flex gap-2">
                      <button 
                        onClick={() => toggleParam('temp')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          visibleParams.temp 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${visibleParams.temp ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                        Temp
                      </button>

                      <button 
                        onClick={() => toggleParam('ph')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          visibleParams.ph 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${visibleParams.ph ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        pH
                      </button>

                      <button 
                        onClick={() => toggleParam('turb')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          visibleParams.turb 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${visibleParams.turb ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                        Turbidity
                      </button>
                  </div>
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
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* LEGEND REMOVED - Controlled by Buttons */}

                    {visibleParams.temp && (
                      <>
                        <Area type="monotone" dataKey="temp_forecast" fill="url(#gradTemp)" stroke="none" tooltipType="none" />
                        <Line type="monotone" dataKey="temp_forecast" name="Temperature" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </>
                    )}
                    {visibleParams.ph && (
                      <>
                        <Area type="monotone" dataKey="ph_forecast" fill="url(#gradPh)" stroke="none" tooltipType="none" />
                        <Line type="monotone" dataKey="ph_forecast" name="pH Level" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </>
                    )}
                    {visibleParams.turb && (
                      <>
                        <Area type="monotone" dataKey="turb_forecast" fill="url(#gradTurb)" stroke="none" tooltipType="none" />
                        <Line type="monotone" dataKey="turb_forecast" name="Turbidity" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
               <div className="text-sm font-medium italic">No forecast data available.</div>
               <div className="text-xs mt-2 text-center">
                  Ensure database path <br/>
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">/RiverMonitor/Forecasts/data</code> exists.
               </div>
            </div>
        )}
      </div>

      {/* 3. FORECAST DATA TABLE */}
      <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                 <TableIcon className="w-5 h-5 text-slate-500" />
                 <h3 className="text-lg font-bold text-slate-800">Forecast Data Table</h3>
             </div>
             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                 {data.length} Predictions
             </span>
         </div>

         <div className="overflow-x-auto max-h-[400px]">
             <table className="w-full text-sm text-left text-slate-600">
                 <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0 z-10">
                     <tr>
                         <th className="px-4 py-3 rounded-tl-lg">Projected Time</th>
                         {visibleParams.temp && <th className="px-4 py-3">Temperature (°C)</th>}
                         {visibleParams.ph && <th className="px-4 py-3">pH Level</th>}
                         {visibleParams.turb && <th className="px-4 py-3">Turbidity (NTU)</th>}
                     </tr>
                 </thead>
                 <tbody>
                     {data.length > 0 ? (
                         data.map((row) => (
                             <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                     {row.fullDate} <span className="text-slate-400 text-xs ml-1">({row.name})</span>
                                 </td>
                                 
                                 {visibleParams.temp && (
                                    <td className="px-4 py-3 text-blue-600 font-mono">
                                        {row.temp_forecast !== null ? row.temp_forecast.toFixed(2) : '--'}
                                    </td>
                                 )}
                                 
                                 {visibleParams.ph && (
                                     <td className="px-4 py-3 text-emerald-600 font-mono">
                                         {row.ph_forecast !== null ? row.ph_forecast.toFixed(2) : '--'}
                                     </td>
                                 )}
                                 
                                 {visibleParams.turb && (
                                     <td className="px-4 py-3 text-amber-600 font-mono">
                                         {row.turb_forecast !== null ? row.turb_forecast.toFixed(2) : '--'}
                                     </td>
                                 )}
                             </tr>
                         ))
                     ) : (
                         <tr>
                             <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic">
                                 {isLoading ? 'Loading forecast...' : 'No forecast data available for this range.'}
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
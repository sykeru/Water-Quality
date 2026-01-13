import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Zap, Check, Lightbulb, TrendingUp, Table as TableIcon } from 'lucide-react';

export default function Forecast({ dataSource, forecastData, lastTimestamp = Date.now() }) {
  const [activeInterval, setActiveInterval] = useState('hourly_24h');
  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: false, turb: false });

  // --- DATA PROCESSING ENGINE ---
  const data = useMemo(() => {
    if (dataSource === 'real') {
      if (!forecastData || !forecastData['Surface Temperature']) return [];

      const tempNode = forecastData['Surface Temperature']?.[activeInterval];
      const phNode = forecastData['pH']?.[activeInterval];
      const turbNode = forecastData['Turbidity']?.[activeInterval];

      if (!tempNode) return [];

      const indices = Object.keys(tempNode).sort((a,b) => Number(a) - Number(b));

      return indices.map(i => {
        const index = Number(i);
        let displayLabel = `+${index+1}`; // X-Axis Label (Short)
        
        // --- DATE CALCULATION LOGIC ---
        let timeOffset = 0;
        
        if (activeInterval.includes('hourly')) {
            displayLabel += 'h';
            // Hourly means +1 hour per index
            timeOffset = (index + 1) * 60 * 60 * 1000;
        } else {
            displayLabel += 'd';
            // Daily means +1 day per index
            timeOffset = (index + 1) * 24 * 60 * 60 * 1000;
        }

        // Calculate the future date based on the LAST received data point
        const futureDate = new Date(lastTimestamp + timeOffset);
        
        // Format it nicely for the tooltip and table
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
    }
    
    return [];
  }, [dataSource, forecastData, activeInterval, lastTimestamp]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  // --- CUSTOM TOOLTIP ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Get the calculated date from the first payload item
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
      
      {/* HEADER */}
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
          </h2>
          <p className="text-slate-500 text-sm">Projected trends based on historical data patterns.</p>
        </div>
        
        {/* INTERVAL CONTROLS */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {[
            { label: 'Next 24 Hours', key: 'hourly_24h' },
            { label: 'Next 7 Days', key: 'daily_7d' },
            { label: 'Next 30 Days', key: 'daily_30d' }
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

      {/* LEFT COLUMN: PARAMETERS */}
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

        {/* INSIGHTS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Lightbulb className="w-5 h-5 text-violet-500" /> AI Insights
           </h3>
           {data.length > 0 ? (
             <div className="space-y-4">
               <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 text-xs text-violet-800 leading-snug">
                 <TrendingUp className="w-4 h-4 mb-1" />
                 <strong>Trend Analysis:</strong> Data indicates a {activeInterval.includes('hourly') ? 'short-term' : 'long-term'} fluctuation pattern consistent with seasonal baselines.
               </div>
             </div>
           ) : (
             <div className="text-xs text-slate-400 italic">Waiting for data...</div>
           )}
        </div>
      </div>

      {/* CHART COLUMN */}
      <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center">
        {data.length > 0 ? (
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
                  <Legend verticalAlign="top" height={36}/>

                  {visibleParams.temp && (
                    <>
                      {/* Added tooltipType="none" to remove duplicate black label from tooltip */}
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
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
               <div className="text-sm font-medium italic">Fetching forecast data...</div>
               <div className="text-xs mt-2">Ensure database path <code className="bg-slate-100 px-1 py-0.5 rounded">/RiverMonitor/Forecasts/data</code> exists.</div>
            </div>
        )}
      </div>

      {/* NEW: FORECAST DATA TABLE */}
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
                                 No forecast data available for this range.
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
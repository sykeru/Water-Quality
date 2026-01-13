import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { SlidersHorizontal, Eye, EyeOff } from 'lucide-react';

export default function AdvancedComparison({ historyData, forecastData }) {
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [visible, setVisible] = useState({ temp: true, ph: true, turb: false }); 

  // --- DATA MERGING ENGINE ---
  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];

    // 1. Find the "Anchor" time (Latest data point)
    // This allows the graph to work even if your sensor data is from 1970
    const lastHistoryItem = historyData[historyData.length - 1];
    const anchorTime = lastHistoryItem ? lastHistoryItem.timestamp : Date.now();
    
    // 2. FILTER HISTORY (Backwards from Anchor)
    let historyCutoff = anchorTime;
    if (timeRange === '24h') historyCutoff -= 24 * 60 * 60 * 1000;
    if (timeRange === '7d')  historyCutoff -= 7 * 24 * 60 * 60 * 1000;
    if (timeRange === '30d') historyCutoff -= 30 * 24 * 60 * 60 * 1000;

    const processedHistory = historyData
      .filter(item => item.timestamp >= historyCutoff)
      .map(item => ({
        timestamp: item.timestamp,
        // Format label differently for 24h vs longer ranges
        displayLabel: timeRange === '24h' 
            ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            : new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'}),
        temp_hist: item.temp,
        ph_hist: item.ph,
        turb_hist: item.turbidity,
        type: 'Historical'
      }));

    // 3. PARSE FORECAST (Forwards from Anchor)
    let processedForecast = [];
    if (forecastData && forecastData['Surface Temperature']) {
      // Map range selection to DB keys
      const keyMap = { '24h': 'hourly_24h', '7d': 'daily_7d', '30d': 'daily_30d' };
      const intervalKey = keyMap[timeRange];
      
      const tempNode = forecastData['Surface Temperature']?.[intervalKey];
      const phNode = forecastData['pH']?.[intervalKey];
      const turbNode = forecastData['Turbidity']?.[intervalKey];

      if (tempNode) {
        // Convert object {0: val, 1: val} to indices
        const indices = Object.keys(tempNode).sort((a, b) => Number(a) - Number(b));
        
        processedForecast = indices.map(i => {
          const index = Number(i);
          // Calculate future timestamp
          let futureTime = anchorTime;
          if (timeRange === '24h') futureTime += (index + 1) * 60 * 60 * 1000; // +1 Hour
          else futureTime += (index + 1) * 24 * 60 * 60 * 1000; // +1 Day

          return {
            timestamp: futureTime,
            displayLabel: timeRange === '24h' ? `+${index+1}h` : `+${index+1}d`,
            temp_fore: Number(tempNode[i]),
            ph_fore: phNode ? Number(phNode[i]) : null,
            turb_fore: turbNode ? Number(turbNode[i]) : null,
            type: 'Forecast'
          };
        });
      }
    }

    // Combine them
    return [...processedHistory, ...processedForecast];

  }, [historyData, forecastData, timeRange]);

  const toggle = (key) => setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg"><SlidersHorizontal className="w-5 h-5 text-indigo-600" /></div>
            Advanced Comparison
          </h3>
          <p className="text-sm text-slate-500 mt-1">Overlay historical data with AI predictions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {/* Range Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['24h', '7d', '30d'].map(r => (
                    <button 
                        key={r} onClick={() => setTimeRange(r)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all uppercase ${
                            timeRange === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        ±{r}
                    </button>
                ))}
            </div>

            {/* Visibility Toggles */}
            <div className="flex gap-2">
                {[
                    { id: 'temp', label: 'Temp', color: '#3b82f6' },
                    { id: 'ph', label: 'pH', color: '#10b981' },
                    { id: 'turb', label: 'Turb', color: '#f59e0b' }
                ].map(p => (
                    <button 
                        key={p.id} onClick={() => toggle(p.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                            visible[p.id] 
                            ? `bg-slate-50 border-slate-200 text-slate-700 opacity-100` 
                            : 'bg-transparent border-transparent text-slate-400 opacity-50'
                        }`}
                    >
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }}></div>
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* CHART AREA */}
      <div className="h-[400px] w-full bg-slate-50 rounded-2xl border border-slate-100 p-4">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    
                    <XAxis 
                        dataKey="displayLabel" 
                        axisLine={false} tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 11}} 
                        minTickGap={40} 
                    />
                    
                    {/* LEFT AXIS: Temp & pH */}
                    <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        axisLine={false} tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                        domain={['auto', 'auto']}
                    />
                    
                    {/* RIGHT AXIS: Turbidity (for huge values) */}
                    <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        axisLine={false} tickLine={false} 
                        tick={{fill: '#f59e0b', fontSize: 11}} 
                        hide={!visible.turb}
                    />
                    
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    
                    {/* Dashed Line separating Past and Future */}
                    <ReferenceLine x={chartData.find(d => d.type === 'Forecast')?.displayLabel} stroke="#94a3b8" strokeDasharray="3 3" label="NOW" />

                    {/* HISTORY (Solid Lines) */}
                    {visible.temp && <Line yAxisId="left" type="monotone" dataKey="temp_hist" name="Temp (Hist)" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                    {visible.ph && <Line yAxisId="left" type="monotone" dataKey="ph_hist" name="pH (Hist)" stroke="#10b981" strokeWidth={2} dot={false} />}
                    {visible.turb && <Line yAxisId="right" type="monotone" dataKey="turb_hist" name="Turbidity (Hist)" stroke="#f59e0b" strokeWidth={2} dot={false} />}

                    {/* FORECAST (Dashed Lines) */}
                    {visible.temp && <Line yAxisId="left" type="monotone" dataKey="temp_fore" name="Temp (Pred)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                    {visible.ph && <Line yAxisId="left" type="monotone" dataKey="ph_fore" name="pH (Pred)" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                    {visible.turb && <Line yAxisId="right" type="monotone" dataKey="turb_fore" name="Turbidity (Pred)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />}

                </ComposedChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
                Waiting for sufficient data to build timeline...
            </div>
        )}
      </div>
    </div>
  );
}
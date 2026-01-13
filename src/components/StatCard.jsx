import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, ReferenceLine, Tooltip 
} from 'recharts';
import CircularGauge from './CircularGauge';
import { getDescriptiveAnalysis } from '../utils/helpers';

const StatCard = ({ title, icon: Icon, baseDataConfig, config, type, liveData, dataSource, historyData = [], lastTimestamp }) => {
  const [showHist, setShowHist] = useState(true);
  const [showFcst, setShowFcst] = useState(true);
  const [chartData, setChartData] = useState([]);

  // --- STATIC COLOR CONFIGURATION ---
  // Actual = Darker, Forecast = Lighter (Pastel)
  const COLORS = {
    temp: {
      actual: '#2563eb',    // Dark Blue
      forecast: '#93c5fd',  // Pastel Blue
      bg: '#eff6ff',        // Blue 50
    },
    ph: {
      actual: '#059669',    // Dark Green
      forecast: '#6ee7b7',  // Pastel Green
      bg: '#ecfdf5',        // Green 50
    },
    turbidity: {
      actual: '#d97706',    // Dark Amber
      forecast: '#fcd34d',  // Pastel Amber
      bg: '#fffbeb',        // Amber 50
    }
  };

  const theme = COLORS[type] || COLORS.temp;

  // --- CONFIGURATION FOR X-AXIS ---
  const ONE_HOUR = 3600 * 1000;
  
  const getCustomTicks = (anchor) => {
    return [
      anchor - (24 * ONE_HOUR),
      anchor - (12 * ONE_HOUR),
      anchor,
      anchor + (12 * ONE_HOUR),
      anchor + (24 * ONE_HOUR),
    ];
  };

  const formatTick = (val) => {
    const diffHours = (val - lastTimestamp) / ONE_HOUR;
    if (Math.abs(diffHours) < 0.1) return 'NOW';
    if (diffHours > 0) return `+${Math.round(diffHours)}h`;
    return `${Math.round(diffHours)}h`;
  };

  // --- DATA PROCESSING EFFECT ---
  useEffect(() => {
    if (!lastTimestamp) return;

    const anchor = lastTimestamp;
    const processedPoints = [];

    // --- CASE 1: SIMULATION MODE ---
    if (dataSource === 'simulation' && historyData.length > 0) {
        const nowIndex = Math.floor(historyData.length / 2);
        historyData.forEach((item, index) => {
            const offsetHours = index - nowIndex;
            const targetTime = anchor + (offsetHours * ONE_HOUR);
            const isHistory = index <= nowIndex;
            const isForecast = index >= nowIndex;

            processedPoints.push({
                x: targetTime,
                hist: isHistory ? item[type] : null,
                fcst: isForecast ? item[type] : null 
            });
        });
    } 
    // --- CASE 2: REAL DATA MODE ---
    else {
        let lastValidValue = null;
        const startWindow = anchor - (24 * ONE_HOUR);

        const preWindowData = historyData.filter(d => d.timestamp < startWindow);
        if (preWindowData.length > 0) {
            lastValidValue = preWindowData[preWindowData.length - 1][type];
        }

        // HISTORICAL
        for (let i = -24; i <= 0; i++) {
            const targetTime = anchor + (i * ONE_HOUR);
            const found = historyData.find(d => Math.abs(d.timestamp - targetTime) <= (ONE_HOUR / 2));
            
            if (found) {
                lastValidValue = found[type];
            } else if (i === 0 && liveData !== undefined && dataSource === 'real') {
                lastValidValue = liveData;
            }

            processedPoints.push({ 
                x: targetTime, 
                hist: lastValidValue, 
                fcst: (i === 0) ? lastValidValue : null 
            });
        }

        // FORECAST
        let lastForecastVal = lastValidValue ?? liveData ?? 0;
        for (let i = 1; i <= 24; i++) {
            const targetTime = anchor + (i * ONE_HOUR);
            const change = (Math.random() - 0.5) * (baseDataConfig.volatility || 1);
            const projected = lastForecastVal + change;
            lastForecastVal = projected;
            
            processedPoints.push({ x: targetTime, hist: null, fcst: projected });
        }
    }

    setChartData(processedPoints);

  }, [lastTimestamp, historyData, liveData, type, baseDataConfig, dataSource]);


  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const timeStr = new Date(label).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const relLabel = formatTick(label);
      
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold text-slate-700 mb-1">{relLabel} ({timeStr})</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
                <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="capitalize font-semibold">{entry.name}:</span>
                <span>{Number(entry.value).toFixed(2)} {config.unit}</span>
                </div>
            )
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
          {dataSource === 'real' && historyData.length === 0 ? 'Waiting for data stream...' : getDescriptiveAnalysis(type, liveData)}
        </p>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-4 w-full justify-center mb-4 border-t border-slate-50 pt-4 mt-2">
        {/* ACTUAL BUTTON */}
        <button 
          onClick={() => setShowHist(!showHist)} 
          style={{
            backgroundColor: showHist ? theme.bg : 'white',
            color: showHist ? theme.actual : '#94a3b8',
            borderColor: showHist ? theme.actual : '#e2e8f0'
          }}
          className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
        >
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: showHist ? theme.actual : '#cbd5e1' }}
          ></span> 
          Actual
        </button>

        {/* FORECAST BUTTON */}
        <button 
          onClick={() => setShowFcst(!showFcst)} 
          style={{
            backgroundColor: showFcst ? theme.bg : 'white',
            color: showFcst ? theme.actual : '#94a3b8',   // Matches Actual Text Color
            borderColor: showFcst ? theme.actual : '#e2e8f0', // Matches Actual Border Color
            borderStyle: showFcst ? 'dashed' : 'solid'    // DASHED BORDER
          }}
          className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border-2 transition-all"
        >
          <span 
            className="w-2 h-2 rounded-full border-2 border-dashed" 
            style={{ borderColor: showFcst ? theme.forecast : '#cbd5e1' }} // Dot matches the Lighter Line
          ></span> 
          Forecast
        </button>
      </div>
      
      {/* CHART */}
      <div className="h-48 w-full flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              
              <XAxis 
                dataKey="x" 
                type="number" 
                axisLine={false} 
                tickLine={false} 
                domain={[lastTimestamp - (24 * ONE_HOUR), lastTimestamp + (24 * ONE_HOUR)]}
                ticks={getCustomTicks(lastTimestamp)}
                tickFormatter={formatTick}
                tick={{fill: '#94a3b8', fontSize: 10}} 
                allowDataOverflow={true}
                interval={0}
              />
              <YAxis axisLine={false} tickLine={false} width={30} tick={{fill: '#94a3b8', fontSize: 10}} domain={[config.min, config.max]} />
              <Tooltip content={<CustomTooltip />} />
              
              {/* NOW Vertical Line: Broken & Lighter */}
              <ReferenceLine 
                x={lastTimestamp} 
                stroke="#e2e8f0" 
                strokeDasharray="3 3" 
                strokeWidth={2} 
                label={{ value: "NOW", position: 'top', fill: '#94a3b8', fontSize: 10, dy: -5 }} 
              />
              
              {showFcst && (
                <Line 
                  type="monotone" 
                  dataKey="fcst" 
                  name="Forecast" 
                  stroke={theme.forecast} 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false} 
                  activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: theme.forecast }} 
                  isAnimationActive={false}
                  connectNulls={true} 
                />
              )}
              
              {showHist && (
                <Line 
                  type="monotone" 
                  dataKey="hist" 
                  name="Actual" 
                  stroke={theme.actual} 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: theme.actual }} 
                  isAnimationActive={false}
                  connectNulls={true} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-slate-300 font-medium italic">Graph unavailable</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
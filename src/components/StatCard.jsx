import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, ReferenceLine, Tooltip 
} from 'recharts';
import CircularGauge from './CircularGauge';
import ChartControls from './ChartControls';
import { getDescriptiveAnalysis } from '../utils/helpers';

const StatCard = ({ title, icon: Icon, baseDataConfig, config, type, liveData, dataSource, historyData = [] }) => {
  const [showHist, setShowHist] = useState(true);
  const [showFcst, setShowFcst] = useState(true);
  const [timeframe, setTimeframe] = useState('1m'); 
  const [chartData, setChartData] = useState([]);

  // --- HELPER: FORMAT TOOLTIP TIME ---
  const formatTooltipLabel = (val, tf) => {
    if (Math.abs(val) < 0.001) return 'NOW';
    
    const sign = val > 0 ? '+' : '-';
    const absVal = Math.abs(val);

    // 1m (Base Unit: Seconds)
    if (tf === '1m') {
      if (absVal >= 60) return `${sign}1m`;
      return `${sign}${Math.round(absVal)}s`;
    }

    // 10m (Base Unit: Minutes)
    if (tf === '10m') {
      const totalSeconds = Math.round(absVal * 60);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      if (secs === 0) return `${sign}${mins}m`;
      return `${sign}${mins}m ${secs}s`;
    }

    // 1h (Base Unit: Minutes)
    if (tf === '1h') {
      if (absVal === 60) return `${sign}1h`;
      return `${sign}${Math.round(absVal)}m`;
    }

    return val.toFixed(0);
  };

  // --- CONFIGURATION FOR X-AXIS ---
  const getAxisConfig = (tf) => {
    switch (tf) {
      case '1m':
        return {
          unit: 1000, // Seconds
          domain: [-60, 60],
          // Requested: -1m, -30s, -5s, NOW, +5s, +30s, +1m
          ticks: [-60, -30, 0, 30, 60],
          formatter: (val) => {
            if (val === 0) return 'NOW';
            if (Math.abs(val) === 60) return `${val > 0 ? '+' : '-'}1m`;
            return `${val > 0 ? '+' : ''}${Math.abs(val)}s`;
          }
        };
      case '10m':
        return {
          unit: 1000 * 60, // Minutes
          domain: [-10, 10],
          // Requested: -10m, -5m, -1m, NOW, +1m, +5m, +10m
          ticks: [-10, -5, 0, 5, 10],
          formatter: (val) => {
            if (val === 0) return 'NOW';
            return `${val > 0 ? '+' : ''}${Math.abs(val)}m`;
          }
        };
      case '1h':
        return {
          unit: 1000 * 60, // Minutes
          domain: [-60, 60],
          // Requested: -1h, -30m, -10m, NOW, +10m, +30m, +1h
          ticks: [-60, -30, 0, 30, 60],
          formatter: (val) => {
            if (val === 0) return 'NOW';
            if (Math.abs(val) === 60) return `${val > 0 ? '+' : '-'}1h`;
            return `${val > 0 ? '+' : ''}${Math.abs(val)}m`;
          }
        };
      default:
        return { unit: 1000, domain: [-60, 60], ticks: [-60, 0, 60], formatter: (val) => val };
    }
  };

  useEffect(() => {
    if (dataSource === 'real' && historyData.length === 0) {
      setChartData([]);
      return;
    }

    const axisConfig = getAxisConfig(timeframe);
    const now = Date.now();

    // 1. Process History
    const processedHistory = historyData.map(entry => ({
      x: (entry.timestamp - now) / axisConfig.unit,
      hist: entry[type],
      fcst: null,
      isForecast: false
    }));

    // 2. Create "Now" Connection Point
    const nowPoint = {
      x: 0,
      hist: liveData,
      fcst: liveData, 
      isForecast: false
    };

    // 3. Generate Forecast
    const forecastPoints = [];
    const steps = 10; 
    const stepSize = axisConfig.domain[1] / steps; 

    for (let i = 1; i <= steps; i++) {
      const xVal = i * stepSize;
      const noise = (Math.random() - 0.5) * baseDataConfig.volatility;
      const projectedValue = liveData + noise + (i * (Math.random() - 0.5)); 
      
      forecastPoints.push({
        x: xVal,
        hist: null,
        fcst: projectedValue,
        isForecast: true
      });
    }

    setChartData([...processedHistory, nowPoint, ...forecastPoints]);

  }, [timeframe, liveData, baseDataConfig, dataSource, historyData, type]);

  const axisConfig = getAxisConfig(timeframe);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold text-slate-700 mb-1">{formatTooltipLabel(label, timeframe)}</p>
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
          {dataSource === 'real' && historyData.length === 0 ? 'Waiting for data stream...' : getDescriptiveAnalysis(type, liveData)}
        </p>
      </div>

      <ChartControls timeframe={timeframe} setTimeframe={setTimeframe} showHist={showHist} setShowHist={setShowHist} showFcst={showFcst} setShowFcst={setShowFcst} />
      
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
                domain={axisConfig.domain}
                ticks={axisConfig.ticks}
                tickFormatter={axisConfig.formatter}
                tick={{fill: '#94a3b8', fontSize: 10}} 
                allowDataOverflow={true}
                interval={0} // Force show all ticks
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                width={25} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                domain={[config.min, config.max]} 
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* NOW Vertical Line */}
              <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              
              {showFcst && (
                <Line 
                  type="monotone" 
                  dataKey="fcst" 
                  name="Forecast" 
                  stroke="#f97316" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.6} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 0 }} 
                  isAnimationActive={false}
                  connectNulls={false} 
                />
              )}
              
              {showHist && (
                <Line 
                  type="monotone" 
                  dataKey="hist" 
                  name="Actual" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                  dot={false} 
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }} 
                  isAnimationActive={false}
                  connectNulls={false} 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-slate-300 font-medium italic">Graph unavailable (No Data)</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
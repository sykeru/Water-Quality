import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { SlidersHorizontal, Check } from 'lucide-react';
import StatCard from '../components/StatCard';
// import WaterQualityIndexCard from '../components/WaterQualityIndexCard';

const Dashboard = ({ metrics, liveValues, dataSource, simulationHistory }) => {
  // ... (Comparison State Logic kept same as before, simplified for brevity) ...
  const [compRange, setCompRange] = useState('24h');
  const [compParams, setCompParams] = useState({ actual_temp: true, actual_ph: false, actual_turb: false, pred_temp: false, pred_ph: false, pred_turb: false, wqi: false });

  const comparisonData = useMemo(() => {
    if (dataSource === 'real') return [];
    // Just a placeholder mock for comparison for now
    const data = []; const points = 24; const now = new Date();
    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() - ((points - i) * 3600 * 1000));
      data.push({ displayTime: time.toLocaleTimeString([], {hour: '2-digit'}), temp: 25 + Math.random(), ph: 7 + Math.random(), turbidity: 10 + Math.random(), wqi: 80 });
    }
    return data;
  }, [dataSource]);

  const toggleParam = (key) => setCompParams(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {metrics.map((metric, index) => (
          <div key={index} className="h-[600px]">
            <StatCard 
              title={metric.title} 
              icon={metric.icon} 
              baseDataConfig={metric.baseDataConfig} 
              config={metric.config} 
              type={metric.type} 
              liveData={liveValues[metric.type]} 
              dataSource={dataSource} 
              historyData={simulationHistory} // PASS HISTORY HERE
            />
          </div>
        ))}
        {/* <WaterQualityIndexCard liveValues={liveValues} /> */}
      </div>

      {/* Advanced Comparison (Kept same structure) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-50 rounded-lg"><SlidersHorizontal className="w-5 h-5 text-indigo-600" /></div>
              <h2 className="text-xl font-extrabold text-slate-800">Advanced Comparison</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">Overlay multiple parameters to find correlations.</p>
          </div>
        </div>
        <div className="lg:col-span-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center min-h-[300px]">
             <div className="text-slate-400 font-medium italic text-sm">Comparison chart populated by History module.</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
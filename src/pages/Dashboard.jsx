import React from 'react';
import StatCard from '../components/StatCard'; 
import WQICard from '../components/WQICard'; 

const Dashboard = ({ metrics, liveValues, dataSource, historyData, lastUpdated }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">System Overview</h2>
          <p className="text-slate-500 mt-1">Real-time sensor fusion and predictive analytics.</p>
        </div>
        <div className="hidden md:block text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
           Last Update: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <StatCard 
            key={index} 
            {...metric} 
            liveData={liveValues[metric.type]} 
            dataSource={dataSource} 
            historyData={historyData} 
            lastTimestamp={lastUpdated} 
          />
        ))}
      </div>

      {/* Footer / WQI Section - Wrapper removed to allow full width */}
      <div className="mt-8 pt-8 border-t border-slate-200">
         <WQICard liveValues={liveValues} />
      </div>

    </div>
  );
};

export default Dashboard;
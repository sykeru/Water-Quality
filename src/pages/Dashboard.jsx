import React from 'react';
import { Activity } from 'lucide-react';
import StatCard from '../components/StatCard'; 

const Dashboard = ({ metrics, liveValues, dataSource, historyData, forecastData }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800">System Overview</h2>
          <p className="text-slate-500 mt-1">Real-time sensor fusion and predictive analytics.</p>
        </div>
        <div className="hidden md:block text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
           Last Data: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* LAYOUT FIX: 
        - grid-cols-1: Mobile (default)
        - md:grid-cols-3: Force 3 columns on Tablet (md) and up. 
          This ensures vertical monitors (which often report as tablet width) see 3 columns.
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <StatCard 
            key={index} 
            {...metric} 
            liveData={liveValues[metric.type]} 
            dataSource={dataSource} 
            historyData={historyData} 
          />
        ))}
      </div>

      {/* Footer / WQI Section */}
      <div className="mt-8 pt-8 border-t border-slate-200">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Water Quality Index</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-800">92</span>
              <span className="text-lg font-bold text-emerald-500">Excellent</span>
            </div>
            <p className="text-sm text-slate-500 mt-2 max-w-md">
              Based on the weighted arithmetic mean of Temperature, pH, and Turbidity parameters relative to DENR standards.
            </p>
          </div>
          <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center border-2 border-orange-100">
             <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
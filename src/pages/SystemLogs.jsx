import React from 'react';
import { Terminal, Database, ArrowDown, Code, BrainCircuit } from 'lucide-react';

export default function SystemLogs({ logs, dataSource, forecastData, onClearData }) {
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-slate-700" />
            <h2 className="text-2xl font-extrabold text-slate-800">Input Data (Raw Logs)</h2>
        </div>

        {/* CLEAR DATA BUTTON (Only for Simulation) */}
        {dataSource === 'simulation' && (
            <button 
                onClick={onClearData}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors shadow-sm"
            >
                <Trash2 className="w-4 h-4" />
                Clear Simulated Data
            </button>
        )}
      </div>

      {/* 1. SENSOR LOGS CARD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <Database className="w-4 h-4 text-blue-500" />
             <span className="font-bold text-slate-700">Database Retrieval Stream</span>
           </div>
           <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
             {logs.length} records fetched
           </span>
        </div>

        {/* RAW DATA VIEW */}
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col h-[400px]">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
             <span className="text-xs font-mono text-slate-400">/RiverMonitor/History</span>
             <Code className="w-3 h-3 text-slate-500" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-emerald-400 space-y-1">
             {logs.length === 0 ? (
               <div className="text-slate-500 italic text-center mt-10">Waiting for data stream...</div>
             ) : (
               [...logs].reverse().map((log) => (
                 <div key={log.id} className="border-b border-slate-800/50 pb-1 mb-1 hover:bg-slate-800/30">
                   <span className="text-blue-400">ID: {log.id}</span>
                   <span className="text-slate-500 mx-2">|</span>
                   <span className="text-amber-300">TS: {log.timestamp}</span>
                   <br/>
                   <span className="text-slate-300 ml-4">
                     {JSON.stringify(log.raw || {temp: log.temp, ph: log.ph, turb: log.turbidity})}
                   </span>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>

      {/* 2. FORECAST DATA CARD (ADDED BACK) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
             <BrainCircuit className="w-4 h-4 text-violet-500" />
             <span className="font-bold text-slate-700">Raw Forecast Object</span>
           </div>
           <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
             JSON Object
           </span>
        </div>

        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col h-[300px]">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
             <span className="text-xs font-mono text-slate-400">/RiverMonitor/Forecasts/data</span>
             <Code className="w-3 h-3 text-slate-500" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-violet-300">
             {forecastData ? (
               <pre className="whitespace-pre-wrap break-all">
                 {JSON.stringify(forecastData, null, 2)}
               </pre>
             ) : (
               <div className="text-slate-500 italic text-center mt-10">No forecast data available.</div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}
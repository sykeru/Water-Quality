import React from 'react';
import { Terminal, Play, Pause, Database, Activity, Server, ArrowDown } from 'lucide-react';

export default function SystemLogs({ 
  logs, 
  dataSource, 
  isSimulationRunning, 
  setIsSimulationRunning 
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-6 h-6 text-slate-700" />
        <h2 className="text-2xl font-extrabold text-slate-800">Input Data</h2>
      </div>

      {/* 1. DATA SOURCE & CONTROLS BOX */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        
        {/* ROW: SOURCE + BUTTON */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Left: Source Indicator */}
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Fetching data from:</span>
             <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
                dataSource === 'real' 
                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
                {dataSource === 'real' ? <Database className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                {dataSource === 'real' ? 'Firebase Real-Time' : 'Simulation Engine'}
              </div>
          </div>

          {/* Right: Simulation Button (Only if Sim) */}
          {dataSource === 'simulation' && (
            <button 
              onClick={() => setIsSimulationRunning(!isSimulationRunning)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-md transition-all transform active:scale-95 ${
                isSimulationRunning 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' 
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {isSimulationRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span>{isSimulationRunning ? 'Stop Data Generation' : 'Turn On Simulation'}</span>
            </button>
          )}

          {/* Right: Listener Status (Only if Real) */}
          {dataSource === 'real' && (
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <Server className="w-4 h-4" />
                <span>Listening for incoming packets...</span>
             </div>
          )}

        </div>

        {/* BOTTOM: DESCRIPTION */}
        {dataSource === 'simulation' && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center md:text-right">
             <p className="text-slate-400 text-xs font-medium">
              {isSimulationRunning 
                ? 'Generating realistic diurnal cycles (Sine Wave + Perlin Noise)...' 
                : 'Simulation paused. No data is being generated.'}
            </p>
          </div>
        )}
      </div>

      {/* 2. LOGS STREAM */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Stream</span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">{logs.length} events</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-slate-50 rounded-full mb-3"><ArrowDown className="w-6 h-6 opacity-30" /></div>
              <p className="text-sm font-medium">Log buffer empty.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 hover:bg-slate-50 transition-colors text-xs sm:text-sm">
                  <div className="font-mono text-slate-400 w-20 shrink-0">{log.timestamp}</div>
                  
                  <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-12 text-center ${
                    log.source === 'real' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {log.source === 'real' ? 'DB' : 'SIM'}
                  </div>

                  <div className="flex-grow font-mono text-slate-600 flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> T: <b className="text-slate-800">{log.data.temp.toFixed(1)}</b></span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> pH: <b className="text-slate-800">{log.data.ph.toFixed(2)}</b></span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Turb: <b className="text-slate-800">{log.data.turbidity.toFixed(1)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
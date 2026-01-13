import React from 'react';
import { CheckCircle, Bell, Thermometer, Droplet, Waves, Save, Database, Play, Square, LayoutTemplate } from 'lucide-react';

const Settings = ({ appMode, setAppMode, dataSource, setDataSource, thresholds, handleThresholdChange, isSimulationRunning, toggleSimulation }) => {
  return (
    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 1. APPLICATION MODE (Subtle Toggle) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-full"><LayoutTemplate className="w-6 h-6 text-blue-500" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Application Context</h3>
            <p className="text-sm text-slate-500">Select the active project configuration.</p>
          </div>
        </div>

        {/* Segmented Control Switch */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start md:self-center">
            <button 
                onClick={() => setAppMode('elective')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    appMode === 'elective' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Elective: Big Data
            </button>
            <button 
                onClick={() => setAppMode('embedded')}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                    appMode === 'embedded' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Embedded Systems
            </button>
        </div>
      </div>

      {/* 2. DATA SOURCE SELECTOR */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-indigo-50 rounded-full"><Database className="w-6 h-6 text-indigo-500" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Data Source</h3>
            <p className="text-sm text-slate-500">Choose between simulated data or real-time Firebase connection.</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div 
                    onClick={() => setDataSource('real')}
                    className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${dataSource === 'real' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">Real-Time (Firebase)</span>
                    {dataSource === 'real' && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                    </div>
                    <p className="text-xs text-slate-500">Fetch live data from sensor database.</p>
                </div>

                <div 
                    onClick={() => setDataSource('simulation')}
                    className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${dataSource === 'simulation' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">Simulation</span>
                    {dataSource === 'simulation' && <CheckCircle className="w-5 h-5 text-indigo-500" />}
                    </div>
                    <p className="text-xs text-slate-500">Auto-generated data for testing.</p>
                </div>
            </div>

            {/* SIMULATION CONTROLS */}
            {dataSource === 'simulation' && (
                <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div>
                        <h4 className="font-bold text-slate-700 text-sm">Simulation Controller</h4>
                        <p className="text-xs text-slate-500">Generates realistic sensor readings every 5 seconds.</p>
                    </div>
                    <button 
                        onClick={toggleSimulation}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                            isSimulationRunning 
                            ? 'bg-rose-500 text-white hover:bg-rose-600' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                    >
                        {isSimulationRunning ? (
                            <><Square className="w-4 h-4 fill-current" /> Stop Simulation</>
                        ) : (
                            <><Play className="w-4 h-4 fill-current" /> Start Simulation</>
                        )}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* 3. ALERT THRESHOLDS */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div><h3 className="text-xl font-bold text-slate-800">Alert Thresholds</h3><p className="text-sm text-slate-500 mt-1">Receive notifications when readings fall WITHIN these ranges.</p></div>
          <div className="p-2 bg-amber-50 rounded-full"><Bell className="w-6 h-6 text-amber-500" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Thermometer className="w-4 h-4 text-slate-400" /> Temperature</div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.temp.min} onChange={(e) => handleThresholdChange('temp', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.temp.max} onChange={(e) => handleThresholdChange('temp', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Droplet className="w-4 h-4 text-slate-400" /> pH Level</div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.ph.min} onChange={(e) => handleThresholdChange('ph', 'min', e.target.value)} step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.ph.max} onChange={(e) => handleThresholdChange('ph', 'max', e.target.value)} step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 font-bold text-slate-700"><Waves className="w-4 h-4 text-slate-400" /> Turbidity</div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min</label><input type="number" value={thresholds.turbidity.min} onChange={(e) => handleThresholdChange('turbidity', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max</label><input type="number" value={thresholds.turbidity.max} onChange={(e) => handleThresholdChange('turbidity', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end"><button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors"><Save className="w-4 h-4" /> Save Changes</button></div>
      </div>
    </div>
  );
};

export default Settings;
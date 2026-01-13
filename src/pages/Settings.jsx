import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Bell, Thermometer, Droplet, Waves, Save, 
  Database, Play, Square, LayoutTemplate, AlertTriangle 
} from 'lucide-react';

const Settings = ({ 
  appMode, setAppMode, 
  dataSource, setDataSource, 
  thresholds, onSaveThresholds, 
  isSimulationRunning, toggleSimulation 
}) => {
  
  // 1. Local State for buffering changes
  const [localThresholds, setLocalThresholds] = useState(thresholds);
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state if parent state changes (initial load)
  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  // Check for changes to show/hide Save button
  useEffect(() => {
    const isChanged = JSON.stringify(localThresholds) !== JSON.stringify(thresholds);
    setIsDirty(isChanged);
  }, [localThresholds, thresholds]);

  // Handler for updates
  const handleChange = (metric, field, value) => {
    setLocalThresholds(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: field === 'mode' ? value : Number(value)
      }
    }));
  };

  const handleSave = () => {
    onSaveThresholds(localThresholds);
    setIsDirty(false);
  };

  return (
    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 1. APPLICATION CONTEXT */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-full">
            <LayoutTemplate className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Application Context</h3>
            <p className="text-sm text-slate-500">Select the active project configuration.</p>
          </div>
        </div>

        {/* UNIFORM TOGGLE BUTTONS */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto self-start md:self-center">
            <button 
                onClick={() => setAppMode('elective')}
                className={`flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    appMode === 'elective' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Elective
            </button>
            <button 
                onClick={() => setAppMode('embedded')}
                className={`flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    appMode === 'embedded' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                Embedded
            </button>
        </div>
      </div>

      {/* 2. DATA SOURCE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-50 rounded-full">
                    <Database className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Data Source</h3>
                    <p className="text-sm text-slate-500">Choose between simulated data or real-time Firebase connection.</p>
                </div>
            </div>

            {/* UNIFORM TOGGLE BUTTONS */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto self-start md:self-center">
                <button 
                    onClick={() => setDataSource('real')}
                    className={`flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                        dataSource === 'real' 
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Firebase
                </button>
                <button 
                    onClick={() => setDataSource('simulation')}
                    className={`flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                        dataSource === 'simulation' 
                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Simulated
                </button>
            </div>
        </div>

        {/* Integrated Simulation Controls */}
        {dataSource === 'simulation' && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="text-center sm:text-left">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center justify-center sm:justify-start gap-2">
                        Simulation Controller
                        {isSimulationRunning && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Generates realistic sensor readings every 5 seconds.</p>
                </div>
                <button 
                    onClick={toggleSimulation}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                        isSimulationRunning 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                >
                    {isSimulationRunning ? (
                        <><Square className="w-3.5 h-3.5 fill-current" /> Stop Stream</>
                    ) : (
                        <><Play className="w-3.5 h-3.5 fill-current" /> Start Stream</>
                    )}
                </button>
            </div>
        )}
      </div>

      {/* 3. ALERT THRESHOLDS */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Alert Thresholds</h3>
            <p className="text-sm text-slate-500 mt-1">Configure when to trigger system notifications.</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-full"><Bell className="w-6 h-6 text-amber-500" /></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Temperature */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <Thermometer className="w-4 h-4 text-slate-400" /> Temperature
            </div>
            
            {/* Condition Toggle */}
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Notify When Reading Is:</label>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 mt-1">
                    <button onClick={() => handleChange('temp', 'mode', 'out')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.temp.mode === 'out' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600'}`}>Out of Range</button>
                    <button onClick={() => handleChange('temp', 'mode', 'within')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.temp.mode === 'within' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>Within Range</button>
                </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min (°C)</label><input type="number" value={localThresholds.temp.min} onChange={(e) => handleChange('temp', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max (°C)</label><input type="number" value={localThresholds.temp.max} onChange={(e) => handleChange('temp', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          {/* pH Level */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <Droplet className="w-4 h-4 text-slate-400" /> pH Level
            </div>
            
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Notify When Reading Is:</label>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 mt-1">
                    <button onClick={() => handleChange('ph', 'mode', 'out')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.ph.mode === 'out' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600'}`}>Out of Range</button>
                    <button onClick={() => handleChange('ph', 'mode', 'within')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.ph.mode === 'within' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>Within Range</button>
                </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min (pH)</label><input type="number" step="0.1" value={localThresholds.ph.min} onChange={(e) => handleChange('ph', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max (pH)</label><input type="number" step="0.1" value={localThresholds.ph.max} onChange={(e) => handleChange('ph', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          {/* Turbidity */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <Waves className="w-4 h-4 text-slate-400" /> Turbidity
            </div>
            
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Notify When Reading Is:</label>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 mt-1">
                    <button onClick={() => handleChange('turbidity', 'mode', 'out')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.turbidity.mode === 'out' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600'}`}>Out of Range</button>
                    <button onClick={() => handleChange('turbidity', 'mode', 'within')} className={`flex-1 py-1.5 text-[10px] font-bold rounded uppercase transition-colors ${localThresholds.turbidity.mode === 'within' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>Within Range</button>
                </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Min (NTU)</label><input type="number" value={localThresholds.turbidity.min} onChange={(e) => handleChange('turbidity', 'min', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Max (NTU)</label><input type="number" value={localThresholds.turbidity.max} onChange={(e) => handleChange('turbidity', 'max', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-700 focus:outline-none focus:border-blue-500" /></div>
            </div>
          </div>

        </div>

        {/* SAVE BUTTON (Conditionally Rendered) */}
        {isDirty && (
            <div className="mt-6 flex justify-end animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1"
                >
                    <Save className="w-4 h-4" /> Save Changes
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
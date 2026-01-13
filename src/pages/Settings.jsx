import React from 'react';
import { Cpu, CheckCircle, Bell, Thermometer, Droplet, Waves, Save, Database } from 'lucide-react';

const Settings = ({ appMode, setAppMode, dataSource, setDataSource, thresholds, handleThresholdChange }) => {
  return (
    <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 1. DATA SOURCE SELECTOR (NEW) */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-indigo-50 rounded-full"><Database className="w-6 h-6 text-indigo-500" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Data Source</h3>
            <p className="text-sm text-slate-500">Choose between simulated data or real-time Firebase connection.</p>
          </div>
        </div>
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
      </div>

      {/* 2. ALERT THRESHOLDS */}
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

      {/* 1. APP MODE SELECTOR */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-blue-50 rounded-full"><Cpu className="w-6 h-6 text-blue-500" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">System Mode</h3>
            <p className="text-sm text-slate-500">Select the operational context for the dashboard.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div 
            onClick={() => setAppMode('emerging')}
            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${appMode === 'emerging' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-700">Embedded/Emerging</span>
              {appMode === 'emerging' && <CheckCircle className="w-5 h-5 text-blue-500" />}
            </div>
          </div>

          <div 
            onClick={() => setAppMode('elective')}
            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${appMode === 'elective' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-700">Elective</span>
              {appMode === 'elective' && <CheckCircle className="w-5 h-5 text-blue-500" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
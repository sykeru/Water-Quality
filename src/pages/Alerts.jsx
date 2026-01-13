import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Filter, Check, ArrowDown, ArrowUp, Trash2, 
  AlertTriangle, CheckCircle, Info, Calendar, Bell 
} from 'lucide-react';

const Alerts = ({ notifications, clearNotifications }) => {
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'all', 
    sortOrder: 'desc', 
    types: { alert: true, info: true, warning: true, success: true },
    params: { temp: true, ph: true, turbidity: true, system: true },
    isOpen: false 
  });
  
  const filterMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setFilterConfig(prev => ({ ...prev, isOpen: false }));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter(n => {
      if (!filterConfig.types[n.type]) return false;
      let isSystem = !n.text.includes('Temperature') && !n.text.includes('pH') && !n.text.includes('Turbidity');
      if (n.text.includes('Temperature') && !filterConfig.params.temp) return false;
      if (n.text.includes('pH') && !filterConfig.params.ph) return false;
      if (n.text.includes('Turbidity') && !filterConfig.params.turbidity) return false;
      if (isSystem && !filterConfig.params.system) return false;
      const now = Date.now();
      const diff = now - n.id;
      const oneDay = 24 * 60 * 60 * 1000;
      if (filterConfig.timeRange === '24h' && diff > oneDay) return false;
      if (filterConfig.timeRange === '7d' && diff > 7 * oneDay) return false;
      if (filterConfig.timeRange === '30d' && diff > 30 * oneDay) return false;
      return true;
    });
    return filtered.sort((a, b) => filterConfig.sortOrder === 'desc' ? b.id - a.id : a.id - b.id);
  }, [notifications, filterConfig]);

  const toggleFilterType = (key) => setFilterConfig(prev => ({ ...prev, types: { ...prev.types, [key]: !prev.types[key] } }));
  const toggleFilterParam = (key) => setFilterConfig(prev => ({ ...prev, params: { ...prev.params, [key]: !prev.params[key] } }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER CARD (New Style) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            Alerts & Events
            {notifications.length > 0 && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">System notifications and critical warnings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          {/* Time Range Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto">
            {['all', '24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setFilterConfig(prev => ({...prev, timeRange: tf}))}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterConfig.timeRange === tf ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
             {/* Filter Dropdown */}
             <div className="relative" ref={filterMenuRef}>
                <button 
                  onClick={() => setFilterConfig(prev => ({...prev, isOpen: !prev.isOpen}))} 
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition-all h-full ${filterConfig.isOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Filter className="w-4 h-4" /> Filter
                </button>
                {filterConfig.isOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">By Type</p>
                      {Object.keys(filterConfig.types).map(type => (
                        <div key={type} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-slate-50 p-1 rounded" onClick={() => toggleFilterType(type)}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterConfig.types[type] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{filterConfig.types[type] && <Check className="w-3 h-3 text-white" />}</div>
                          <span className="text-xs font-semibold capitalize text-slate-700">{type}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">By Parameter</p>
                      {Object.keys(filterConfig.params).map(param => (
                        <div key={param} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-slate-50 p-1 rounded" onClick={() => toggleFilterParam(param)}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterConfig.params[param] ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{filterConfig.params[param] && <Check className="w-3 h-3 text-white" />}</div>
                          <span className="text-xs font-semibold capitalize text-slate-700">{param}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Button */}
              <button 
                onClick={() => setFilterConfig(prev => ({...prev, sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'}))} 
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {filterConfig.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />} Sort
              </button>

              {/* Clear Button */}
              <button 
                onClick={clearNotifications} 
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>

      {/* LIST CONTENT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-64">
              <div className="p-4 bg-slate-50 rounded-full mb-3"><Bell className="w-8 h-8 text-slate-300" /></div>
              <p className="font-semibold">No notifications match your filters.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div key={notif.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                <div className={`p-3 rounded-full flex-shrink-0 ${notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                  {notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : notif.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 text-sm">{notif.text}</p>
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded-full group-hover:bg-white group-hover:shadow-sm transition-all">{notif.type.toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium"><Calendar className="w-3 h-3" /> {notif.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
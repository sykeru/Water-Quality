import React, { useState, useMemo } from 'react';
import { Bell, CheckCircle, Trash2, AlertTriangle, Info, XCircle } from 'lucide-react';

export default function Alerts({ notifications = [], clearNotifications }) {
  const [filter, setFilter] = useState('all'); // 'all', 'warning'

  // --- SAFE FILTERING ENGINE ---
  const filteredAlerts = useMemo(() => {
    // 1. Safety Check: Ensure notifications is an array
    if (!Array.isArray(notifications)) return [];

    // 2. Filter Logic
    return notifications.filter(n => {
      if (!n) return false; // Skip null entries
      
      const type = n.type || 'info'; 
      
      // If filter is 'all', show everything. Otherwise match type.
      if (filter === 'all') return true;
      return type === filter;
    });
  }, [notifications, filter]);

  // Helper for icons
  const getIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            System Alerts
            {notifications.length > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm">History of threshold violations and events.</p>
        </div>

        <div className="flex gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {['all', 'warning'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                            filter === f 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            
            {/* Clear Button */}
            {notifications.length > 0 && (
                <button 
                    onClick={clearNotifications}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                </button>
            )}
        </div>
      </div>

      {/* ALERTS LIST */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          [...filteredAlerts].reverse().map((alert) => (
            <div 
              key={alert.id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group"
            >
              <div className={`p-3 rounded-full shrink-0 ${alert.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                {getIcon(alert.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm">{alert.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                    {alert.message}
                </p>
                <div className="mt-2 text-xs text-slate-400">
                    {new Date(alert.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="p-4 bg-slate-50 rounded-full mb-3">
                <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No alerts found</p>
            <p className="text-slate-400 text-xs mt-1">System is running within normal parameters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
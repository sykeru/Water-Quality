import React from 'react';
import { 
  LayoutDashboard, History, TrendingUp, FileText, Bell, Settings, X, Wifi, WifiOff, PowerOff,
  Terminal, Menu 
} from 'lucide-react';

const Sidebar = ({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, deviceStatus }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    // { id: 'advisory', label: 'Smart Advisory', icon: FileText },
    { id: 'alerts', label: 'Alerts & Events', icon: Bell },
    { id: 'systemlogs', label: 'Input Data', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getStatusConfig = (status) => {
    switch(status) {
      case 'online': return { color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', label: 'Online', icon: Wifi };
      case 'offline': return { color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', label: 'Offline', icon: PowerOff };
      case 'disconnected': return { color: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', label: 'Disconnected', icon: WifiOff };
      default: return { color: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-500', label: 'Unknown', icon: X };
    }
  };

  const statusConfig = getStatusConfig(deviceStatus);

  return (
    <aside 
      className={`bg-white h-screen border-r border-slate-200 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        isMenuOpen ? 'w-60 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <div className="w-60 h-full flex flex-col p-6">
        
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
            title="Close Menu"
          >
             <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const ItemIcon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <ItemIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Device Status</div>
          <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${statusConfig.bg} ${statusConfig.border}`}>
            <div className="relative">
               <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.color} ${deviceStatus === 'online' ? 'animate-pulse' : ''}`}></div>
               {deviceStatus === 'online' && <div className={`absolute -inset-1 rounded-full ${statusConfig.color} opacity-20 animate-ping`}></div>}
            </div>
            <span className={`text-sm font-bold ${statusConfig.text}`}>{statusConfig.label}</span>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Home, Settings } from 'lucide-react';

const Header = ({ 
  isMenuOpen, 
  setIsMenuOpen, 
  activeTab, 
  setActiveTab, 
  notifications = [], // Default to empty array to be safe
  clearNotifications, 
  isNotificationsOpen, 
  setIsNotificationsOpen,
  headerConfig // Receive title/desc config
}) => {
  const notificationRef = useRef(null);
  const notificationBtnRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target) && !notificationBtnRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsNotificationsOpen]);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-40 h-[88px]">
      <div className="flex items-center gap-6">
        
        {/* Only show Header Menu Button if Sidebar is CLOSED */}
        {!isMenuOpen && (
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        )}

        {/* TITLE & DESCRIPTION */}
        <div>
           <h1 className="font-extrabold text-slate-900 tracking-tight uppercase text-2xl leading-none">
             {headerConfig.title}
           </h1>
           <p className="text-slate-500 text-xs mt-1 font-medium">
             {headerConfig.desc}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        
        {/* NOTIFICATION BELL (Modified) */}
        <button 
          ref={notificationBtnRef}
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
          className={`p-2 rounded-full relative transition-colors ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
          )}
        </button>

        {/* NOTIFICATION DROPDOWN (Modified Logic) */}
        {isNotificationsOpen && (
          <div ref={notificationRef} className="absolute top-14 right-10 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 animate-in fade-in slide-in-from-top-2 z-50 origin-top-right">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-700">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={clearNotifications}
                  className="text-xs text-rose-500 font-bold hover:text-rose-600 uppercase transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                   <p className="text-sm text-slate-400 font-medium">No new notifications</p>
                </div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border-b border-slate-50 last:border-0 group">
                    <div className="flex justify-between items-start mb-1">
                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${notif.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                         {notif.type || 'info'}
                       </span>
                       <span className="text-[10px] text-slate-400">
                          {new Date(notif.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-3 mt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setActiveTab('alerts'); 
                    setIsNotificationsOpen(false);
                  }} 
                  className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 py-2 rounded-lg transition-colors text-center"
                >
                  View All Activity
                </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' ? (
          <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-slate-100 text-slate-800 rounded-full hover:bg-slate-200 transition-colors" title="Return to Dashboard"><Home className="w-5 h-5" /></button>
        ) : (
          <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors" title="Go to Settings"><Settings className="w-5 h-5" /></button>
        )}
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">JD</div>
      </div>
    </nav>
  );
};

export default Header;
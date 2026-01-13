import React from 'react';
import { History, TrendingUp, FileText } from 'lucide-react';

const PlaceholderPage = ({ activeTab }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center bg-white rounded-3xl border border-dashed border-slate-300 animate-in fade-in slide-in-from-bottom-4">
      <div className="p-4 bg-slate-50 rounded-full mb-4">
         {activeTab === 'history' && <History className="w-10 h-10 text-slate-400" />}
         {activeTab === 'forecast' && <TrendingUp className="w-10 h-10 text-slate-400" />}
         {activeTab === 'advisory' && <FileText className="w-10 h-10 text-slate-400" />}
      </div>
      <h2 className="text-2xl font-bold text-slate-700 capitalize">Coming Soon</h2>
      <p className="text-slate-500 mt-2">Data will appear here once sensors are active.</p>
    </div>
  );
};

export default PlaceholderPage;
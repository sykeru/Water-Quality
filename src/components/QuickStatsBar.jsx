import React from 'react';
import { gradientStops, getColorFromGradient, getStatusStyle } from '../utils/helpers';

const QuickStatsBar = ({ metrics, liveValues }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-in slide-in-from-top-10 fade-in duration-500 ease-out">
      {metrics.map((metric, index) => {
        const val = liveValues[metric.type] || metric.config.currentValue;
        const dynamicColor = getColorFromGradient(val, metric.config.min, metric.config.max, gradientStops[metric.type]);
        const statusClasses = getStatusStyle(metric.config.status);

        return (
          <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
             <div className="w-5 h-5 rounded-full shadow-inner border-[1px] border-white flex-shrink-0" style={{ backgroundColor: dynamicColor, boxShadow: `0 2px 4px -1px ${dynamicColor}40` }}></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metric.title}</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-bold text-slate-800">{Number(val).toFixed(1)}</span>
                 <span className="text-xs font-semibold text-slate-400">{metric.config.unit}</span>
               </div>
             </div>
             <div className="ml-auto"><span className={`text-sm font-bold px-3 py-1.5 rounded-full border shadow-sm ${statusClasses}`}>{metric.config.status}</span></div>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStatsBar;
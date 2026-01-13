import React from 'react';

const ChartControls = ({ timeframe, setTimeframe, showHist, setShowHist, showFcst, setShowFcst }) => {
  return (
    <div className="flex flex-col items-center gap-3 mb-4 border-t border-slate-50 pt-4 mt-2 w-full">
      <div className="flex bg-slate-100 p-0.5 rounded-lg w-full justify-center">
        {/* LOWERCASE LABELS: 1m, 10m, 1h */}
        {['1m', '10m', '1h'].map((tf) => (
          <button 
            key={tf} 
            onClick={() => setTimeframe(tf)} 
            className={`flex-1 px-3 py-1 text-xs font-bold rounded-md transition-all text-center ${
              timeframe === tf ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
      <div className="flex gap-4 w-full justify-center">
        <button 
          onClick={() => setShowHist(!showHist)} 
          className={`flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            showHist ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showHist ? 'bg-blue-600' : 'bg-slate-300'}`}></span> Actual
        </button>
        <button 
          onClick={() => setShowFcst(!showFcst)} 
          className={`flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            showFcst ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-400 border-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full border-2 ${showFcst ? 'border-orange-500 border-dashed' : 'border-slate-300 border-dashed'}`}></span> Forecast
        </button>
      </div>
    </div>
  );
};

export default ChartControls;
import React from 'react';

const WaterQualityIndexCard = ({ liveValues }) => {
  const tempScore = Math.max(0, 100 - Math.abs(liveValues.temp - 25) * 2);
  const phScore = Math.max(0, 100 - Math.abs(liveValues.ph - 7) * 15);
  const turbScore = Math.max(0, 100 - liveValues.turbidity * 1.5);
  
  const wqi = Math.round((tempScore + phScore + turbScore) / 3);
  
  let statusText = "Excellent";
  let statusDesc = "The water quality is suitable for all uses, including drinking and aquatic life. All parameters are within optimal ranges.";
  let solidBarColor = "bg-emerald-500";
  
  if (wqi < 80) {
    statusText = "Good";
    statusDesc = "Water quality is generally good but may have minor deviations in one parameter.";
    solidBarColor = "bg-teal-400";
  }
  if (wqi < 60) {
    statusText = "Fair";
    statusDesc = "Water quality is acceptable for irrigation but requires treatment for drinking.";
    solidBarColor = "bg-amber-400";
  }
  if (wqi < 40) {
    statusText = "Poor";
    statusDesc = "Significant pollution detected. Water requires major treatment.";
    solidBarColor = "bg-rose-500";
  }

  return (
    <div className="col-span-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col md:flex-row items-center gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
      <div className="flex flex-col items-center justify-center min-w-[150px]">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Water Quality Index</h3>
        <div className="text-7xl font-extrabold text-slate-800 tracking-tighter">{wqi}</div>
        <div className="text-sm font-bold text-slate-400 mt-1">WQI</div>
      </div>
      
      <div className="flex-grow w-full">
        <div className="flex justify-between items-end mb-2">
          <span className="text-lg font-bold text-slate-700">{statusText}</span>
          <span className="text-xs font-semibold text-slate-400">{wqi}/100</span>
        </div>
        
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full ${solidBarColor} transition-all duration-1000 ease-out rounded-full`} 
            style={{ width: `${wqi}%` }}
          ></div>
        </div>
        
        <p className="text-slate-500 text-sm leading-relaxed">
          {statusDesc}
        </p>
      </div>
    </div>
  );
};

export default WaterQualityIndexCard;
import React, { useMemo } from 'react';

export default function WQICard({ liveValues }) {
  
  // --- WQI CALCULATION ENGINE ---
  const { wqi, status, color, barColor, insight } = useMemo(() => {
    const temp = liveValues?.temp || 25;
    const ph = liveValues?.ph || 7;
    const turb = liveValues?.turbidity || 0;

    const qPh = Math.max(0, 100 - (Math.abs(ph - 7.0) * 20)); 
    const qTurb = Math.max(0, 100 - (turb * 2));
    const qTemp = Math.max(0, 100 - (Math.abs(temp - 25.0) * 3));

    const finalWQI = (qPh * 0.4) + (qTurb * 0.4) + (qTemp * 0.2);
    
    let s, c, b, i;

    if (finalWQI >= 85) {
      s = "Excellent";
      c = "text-emerald-500 bg-emerald-50 border-emerald-100"; 
      b = "bg-emerald-400"; 
      i = "Water quality is excellent. Suitable for all purposes.";
    } else if (finalWQI >= 70) {
      s = "Good";
      c = "text-emerald-500 bg-emerald-50 border-emerald-100"; 
      b = "bg-emerald-400"; 
      i = "Water quality is generally good but may have minor deviations.";
    } else if (finalWQI >= 50) {
      s = "Fair";
      c = "text-amber-500 bg-amber-50 border-amber-100"; 
      b = "bg-amber-400"; 
      i = "Water quality is fair. Moderate treatment required.";
    } else {
      s = "Poor";
      c = "text-rose-500 bg-rose-50 border-rose-100"; 
      b = "bg-rose-500"; 
      i = "Water quality is poor. Significant contamination detected.";
    }

    return { wqi: Math.round(finalWQI), status: s, color: c, barColor: b, insight: i };
  }, [liveValues]);

  return (
    <div className="w-full bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100 animate-in fade-in slide-in-from-bottom-6">
      
      <div className="mb-8 text-left">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
          Water Quality Index
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
        
        {/* LEFT SIDE: SCORE DISPLAY */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-[64px] font-black text-slate-800 leading-none tracking-tighter">
                {wqi}
            </span>
            <span className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                WQI
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: VISUALIZATION & INSIGHT */}
        <div className="flex-1 w-full pt-1">
          <div className="flex justify-between items-end mb-3">
            <span className={`px-4 py-1 rounded-full text-xs font-bold border transition-colors ${color}`}>
                {status}
            </span>
            <span className="text-xs font-mono font-bold text-slate-300">{wqi}/100</span>
          </div>

          <div className="relative mb-6">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div 
                  className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full`} 
                  style={{ width: `${wqi}%` }}
              />
            </div>
            
            <div className="flex justify-between px-0.5">
              <span className="text-[10px] font-bold text-slate-300">0</span>
              <span className="text-[10px] font-bold text-slate-300">50</span>
              <span className="text-[10px] font-bold text-slate-300">100</span>
            </div>
          </div>

          {/* Insight Text - Modified as requested */}
          <div className="flex gap-3 items-start">
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
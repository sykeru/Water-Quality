import React, { useMemo } from 'react';
import { Activity, Info } from 'lucide-react';

export default function WQICard({ liveValues }) {
  
  // --- WQI CALCULATION ENGINE ---
  const { wqi, status, color, barColor, insight } = useMemo(() => {
    // 1. Extract Values
    const temp = liveValues?.temp || 0;
    const ph = liveValues?.ph || 7;
    const turb = liveValues?.turbidity || 0;

    // 2. Normalize Parameters (0-100 Scale)
    let phDiff = Math.abs(ph - 7.5);
    let qPh = Math.max(0, Math.min(100, 100 - (phDiff * 20)));

    let qTurb = Math.max(0, Math.min(100, 100 - (turb * 2)));

    let tempDiff = Math.abs(temp - 25);
    let qTemp = Math.max(0, Math.min(100, 100 - (tempDiff * 5)));

    // 3. Apply Weights
    const wPh = 0.5;
    const wTurb = 0.3;
    const wTemp = 0.2;

    const finalWQI = (qPh * wPh) + (qTurb * wTurb) + (qTemp * wTemp);
    
    // 4. Determine Status & SOLID Colors (No Gradients)
    let s, c, b, i;

    if (finalWQI >= 85) {
      s = "Excellent";
      c = "text-emerald-600 bg-emerald-50 border-emerald-200"; // Pill
      b = "bg-emerald-500"; // Bar (Green)
      i = "Water quality is excellent. Suitable for all purposes.";
    } else if (finalWQI >= 70) {
      s = "Good";
      c = "text-emerald-600 bg-emerald-50 border-emerald-200"; // Pill (Green-ish)
      b = "bg-emerald-400"; // Bar (Light Green)
      i = "Water quality is good. Minor deviations observed.";
    } else if (finalWQI >= 50) {
      s = "Fair";
      c = "text-amber-600 bg-amber-50 border-amber-200"; // Pill
      b = "bg-amber-400"; // Bar (Yellow/Amber)
      i = "Water quality is fair. Moderate treatment required.";
    } else {
      s = "Poor";
      c = "text-rose-600 bg-rose-50 border-rose-200"; // Pill
      b = "bg-rose-500"; // Bar (Red)
      i = "Water quality is poor. Significant contamination detected.";
    }

    return { 
        wqi: Math.round(finalWQI), 
        status: s, 
        color: c, 
        barColor: b,
        insight: i 
    };

  }, [liveValues]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col h-full animate-in fade-in slide-in-from-bottom-6">
      
      {/* 1. UNIFORM HEADER (Matches StatCard) */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-slate-700 font-bold text-lg">Water Quality Index</h3>
        <div className="p-2 bg-slate-50 rounded-xl">
            <Activity className="text-slate-400 w-5 h-5" />
        </div>
      </div>

      {/* 2. SCORE DISPLAY */}
      <div className="flex items-end gap-4 mb-6">
        <span className="text-6xl font-black text-slate-800 leading-none tracking-tight">
            {wqi}
        </span>
        <div className="mb-1.5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
                {status}
            </span>
        </div>
      </div>

      {/* 3. HORIZONTAL VISUALIZATION BAR */}
      <div className="w-full mb-6">
        {/* Labels */}
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
            <span>Critical</span>
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
        </div>
        
        {/* Track */}
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
            {/* The Fill Bar */}
            <div 
                className={`h-full ${barColor} transition-all duration-1000 ease-out rounded-full relative`} 
                style={{ width: `${wqi}%` }}
            >
                {/* Optional: Simple shine to make it look 'wet' without being a gradient */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white opacity-40"></div>
            </div>
        </div>
      </div>

      {/* 4. INSIGHT FOOTER */}
      <div className="mt-auto bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {insight}
        </p>
      </div>

    </div>
  );
}
import React, { useMemo } from 'react';
import { Droplets, Info } from 'lucide-react';

export default function WQICard({ liveValues }) {
  
  // --- WQI CALCULATION ENGINE ---
  const { wqi, status, color, insight } = useMemo(() => {
    // 1. Extract Values (Default to safe values if missing to avoid NaN)
    const temp = liveValues?.temp || 0;
    const ph = liveValues?.ph || 7;
    const turb = liveValues?.turbidity || 0;

    // 2. Normalize Parameters (Convert to 0-100 Quality Rating - Qi)
    
    // pH: Ideal is 7.5. Deviation lowers score.
    // If pH is 7.5, score is 100. If pH < 4 or > 11, score drops rapidly.
    let phDiff = Math.abs(ph - 7.5);
    let qPh = 100 - (phDiff * 20); 
    qPh = Math.max(0, Math.min(100, qPh)); // Clamp between 0-100

    // Turbidity: Ideal is 0-5. 
    // 0 NTU = 100 score. 50 NTU = 0 score.
    let qTurb = 100 - (turb * 2);
    qTurb = Math.max(0, Math.min(100, qTurb));

    // Temperature: Ideal is 25. 
    // Deviation lowers score.
    let tempDiff = Math.abs(temp - 25);
    let qTemp = 100 - (tempDiff * 5); 
    qTemp = Math.max(0, Math.min(100, qTemp));

    // 3. Apply Weights (Wi)
    // pH is critical (0.5), Turbidity visual (0.3), Temp seasonal (0.2)
    const wPh = 0.5;
    const wTurb = 0.3;
    const wTemp = 0.2;

    const finalWQI = (qPh * wPh) + (qTurb * wTurb) + (qTemp * wTemp);
    
    // 4. Determine Status
    let calcStatus = "Poor";
    let calcColor = "bg-red-500 text-red-600 border-red-200";
    let calcInsight = "Water quality is critical. Not suitable for use.";

    if (finalWQI >= 85) {
      calcStatus = "Excellent";
      calcColor = "bg-emerald-500 text-emerald-600 border-emerald-200";
      calcInsight = "The water quality is suitable for all uses, including drinking and aquatic life. All parameters are within optimal ranges.";
    } else if (finalWQI >= 70) {
      calcStatus = "Good";
      calcColor = "bg-blue-500 text-blue-600 border-blue-200";
      calcInsight = "Water quality is acceptable. Minor deviations in turbidity or pH observed.";
    } else if (finalWQI >= 50) {
      calcStatus = "Fair";
      calcColor = "bg-amber-500 text-amber-600 border-amber-200";
      calcInsight = "Water quality is compromised. Moderate pollution detected.";
    } else if (finalWQI >= 30) {
        calcStatus = "Poor";
        calcColor = "bg-orange-500 text-orange-600 border-orange-200";
        calcInsight = "Significant pollution. Treatment required before use.";
    } else {
        calcStatus = "Very Poor";
        calcColor = "bg-rose-600 text-rose-700 border-rose-200";
        calcInsight = "Critical levels of contamination. Hazardous to aquatic life.";
    }

    return { 
        wqi: Math.round(finalWQI), 
        status: calcStatus, 
        color: calcColor, 
        insight: calcInsight 
    };

  }, [liveValues]);

  // Extract base color class for the bar (remove text/border classes)
  const barColor = color.split(' ')[0]; 
  const textColor = color.split(' ')[1];

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start mb-6">
        <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Water Quality Index</h3>
            <div className="flex items-end gap-3">
                <span className="text-6xl font-black text-slate-800 leading-none">{wqi}</span>
                <div className="flex flex-col mb-1">
                    <span className="text-xs font-bold text-slate-400">WQI Score</span>
                    <span className={`text-lg font-bold ${textColor}`}>{status}</span>
                </div>
            </div>
        </div>
        <div className={`p-3 rounded-2xl bg-opacity-10 border ${color.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ')}`}>
            <Droplets className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full mb-4">
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
        </div>
        <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            {/* Background markers */}
            <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-white opacity-50 z-10"></div>
            <div className="absolute top-0 bottom-0 left-2/4 w-0.5 bg-white opacity-50 z-10"></div>
            <div className="absolute top-0 bottom-0 left-3/4 w-0.5 bg-white opacity-50 z-10"></div>
            
            {/* The Bar */}
            <div 
                className={`h-full ${barColor} transition-all duration-1000 ease-out relative`} 
                style={{ width: `${wqi}%` }}
            >
                {/* Glare effect */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-30"></div>
            </div>
        </div>
      </div>

      {/* INSIGHT FOOTER */}
      <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {insight}
        </p>
      </div>

    </div>
  );
}
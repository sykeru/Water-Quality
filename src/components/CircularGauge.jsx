import React from 'react';
import { gradientStops, getColorFromGradient, getStatusStyle } from '../utils/helpers';

const CircularGauge = ({ value, min, max, type, unit, status }) => {
  const radius = 80;
  const stroke = 12;
  const center = 110;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const safeValue = Math.min(Math.max(value, min), max);
  const normalizedValue = (safeValue - min) / (max - min);
  const currentAngle = startAngle + (normalizedValue * totalAngle);

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  const indicatorPos = polarToCartesian(center, center, radius, currentAngle);
  const minLabelPos = polarToCartesian(center, center, radius + 25, startAngle);
  const maxLabelPos = polarToCartesian(center, center, radius + 25, endAngle);

  const renderAngularGradient = () => {
    const stops = gradientStops[type];
    const firstObj = stops[0];
    const lastObj = stops[stops.length - 1];
    const firstColor = `rgba(${firstObj.r},${firstObj.g},${firstObj.b},${firstObj.a})`;
    const lastColor = `rgba(${lastObj.r},${lastObj.g},${lastObj.b},${lastObj.a})`;
    let gradientString = stops.map(s => `rgba(${s.r},${s.g},${s.b},${s.a}) ${s.p * 270}deg`).join(', ');
    gradientString += `, ${lastColor} 285deg, transparent 285deg, transparent 345deg, ${firstColor} 345deg`;
    
    const gradientStyle = { width: '220px', height: '220px', background: `conic-gradient(from 225deg at 50% 50%, ${gradientString})` };
    const maskId = `mask-${type}-bar`;
    const maskEndAngle = type === 'temp' ? currentAngle : endAngle;

    return (
      <>
        <defs><mask id={maskId}><path d={describeArc(center, center, radius, startAngle, maskEndAngle)} fill="none" stroke="white" strokeWidth={stroke} strokeLinecap="round" /></mask></defs>
        <foreignObject x="0" y="0" width="220" height="220" mask={`url(#${maskId})`}><div style={gradientStyle} /></foreignObject>
      </>
    );
  };

  const getDotColor = () => getColorFromGradient(value, min, max, gradientStops[type]);
  const statusClasses = getStatusStyle(status);

  return (
    <div className="relative flex flex-col items-center justify-center -mt-4 w-full">
      {/* RESIZING FIX: 
         Removed fixed width="220" height="180". 
         Added viewBox and className to allow scaling within the 3-column grid.
      */}
      <svg viewBox="0 0 220 180" className="w-full h-auto max-w-[220px] overflow-visible">
        <defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2"/></filter></defs>
        {type === 'temp' && (<path d={describeArc(center, center, radius, startAngle, endAngle)} fill="none" stroke="#e2e8f0" strokeWidth={stroke} strokeLinecap="round" />)}
        {renderAngularGradient()}
        <text x={minLabelPos.x} y={minLabelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-400">{min}</text>
        <text x={maxLabelPos.x} y={maxLabelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-400">{max}</text>
        <circle cx={indicatorPos.x} cy={indicatorPos.y} r="12" fill={getDotColor()} stroke="white" strokeWidth="3" filter="url(#shadow)" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute top-[85px] text-center">
        <div className="text-5xl font-bold text-slate-800 tracking-tight">{Number(value).toFixed(1)}</div>
        <div className="text-sm font-semibold text-slate-400 mt-1 uppercase">{unit}</div>
        <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block border ${statusClasses}`}>{status}</div>
      </div>
    </div>
  );
};

export default CircularGauge;
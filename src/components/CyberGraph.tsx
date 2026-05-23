import React, { useState } from 'react';
import { LineChart } from 'lucide-react';

interface DailyBreakdown {
  date: string;
  income: number;
  expense: number;
}

interface CyberGraphProps {
  dailyBreakdown: DailyBreakdown[];
  formatMoney: (amount: number, currency?: string) => string;
}

export default function CyberGraph({ dailyBreakdown, formatMoney }: CyberGraphProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!dailyBreakdown || dailyBreakdown.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-3xl text-xs text-slate-500 font-mono bg-slate-950/40 p-6 text-center">
        <LineChart className="w-8 h-8 text-slate-700 mb-2" />
        <p className="uppercase tracking-widest text-[10px]">AWAITING_TELEMETRY_DATA_STREAMS</p>
        <p className="text-[9px] text-slate-600 mt-1">Add transactions manually or via telegram to view visualizations.</p>
      </div>
    );
  }

  // Dimensions
  const width = 650;
  const height = 240;
  const padding = { top: 25, right: 25, bottom: 35, left: 75 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find max value scale
  const maxVal = Math.max(
    ...dailyBreakdown.map(d => Math.max(d.income, d.expense)),
    100000 // default minimum IDR scale (Rp 100.000)
  );

  // Math mappings
  const getCoords = (type: 'income' | 'expense') => {
    return dailyBreakdown.map((d, index) => {
      const val = type === 'income' ? d.income : d.expense;
      const x = padding.left + (index / Math.max(1, dailyBreakdown.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (val / (maxVal || 1)) * plotHeight;
      return { x, y, value: val, date: d.date };
    });
  };

  const incomePoints = getCoords('income');
  const expensePoints = getCoords('expense');

  // Convert points to path string
  const makeLinePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  };

  const makeAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    const linePath = makeLinePath(points);
    return `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;
  };

  const incomeLine = makeLinePath(incomePoints);
  const incomeArea = makeAreaPath(incomePoints);

  const expenseLine = makeLinePath(expensePoints);
  const expenseArea = makeAreaPath(expensePoints);

  // Y-Axis Ticks
  const ticksY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full">
      {/* Live Tooltip Indicator Overlay */}
      {hoveredIdx !== null && dailyBreakdown[hoveredIdx] && (
        <div className="absolute top-2 right-2 p-3 bg-slate-950/95 border border-white/[0.08] shadow-[0_0_20px_rgba(0,0,0,0.8)] rounded-xl z-20 font-mono text-[10px] space-y-1 min-w-[150px] pointer-events-none backdrop-blur-md">
          <div className="font-extrabold text-slate-400 border-b border-white/[0.05] pb-1 mb-1 tracking-wider">
            {new Date(dailyBreakdown[hoveredIdx].date).toLocaleDateString(undefined, { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <div className="flex justify-between gap-4 text-emerald-400">
            <span>IN:</span>
            <span className="font-extrabold text-right">{formatMoney(dailyBreakdown[hoveredIdx].income)}</span>
          </div>
          <div className="flex justify-between gap-4 text-fuchsia-400">
            <span>OUT:</span>
            <span className="font-extrabold text-right">{formatMoney(dailyBreakdown[hoveredIdx].expense)}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
          <defs>
            <linearGradient id="incomeShader" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00"/>
            </linearGradient>
            <linearGradient id="expenseShader" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.00"/>
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {ticksY.map((pct, idx) => {
            const y = padding.top + plotHeight - pct * plotHeight;
            const textVal = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={width - padding.right} 
                  y2={y} 
                  className="stroke-white/[0.05] stroke-1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={padding.left - 12} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="fill-slate-500 font-mono text-[9px] font-bold"
                >
                  {textVal >= 1000000 
                    ? `${(textVal / 1000000).toFixed(1)}M` 
                    : textVal >= 1000 
                      ? `${(textVal / 1000).toFixed(0)}K` 
                      : textVal}
                </text>
              </g>
            );
          })}

          {/* Vertical Scanner bar */}
          {hoveredIdx !== null && (
            <line 
              x1={padding.left + (hoveredIdx / Math.max(1, dailyBreakdown.length - 1)) * plotWidth} 
              y1={padding.top} 
              x2={padding.left + (hoveredIdx / Math.max(1, dailyBreakdown.length - 1)) * plotWidth} 
              y2={padding.top + plotHeight} 
              className="stroke-cyan-500/30 stroke-[1.5]" 
            />
          )}

          {/* Fills */}
          {incomePoints.length > 0 && (
            <path d={incomeArea} fill="url(#incomeShader)" />
          )}
          {expensePoints.length > 0 && (
            <path d={expenseArea} fill="url(#expenseShader)" />
          )}

          {/* Glowing strokes */}
          {incomePoints.length > 0 && (
            <path 
              d={incomeLine} 
              className="stroke-emerald-400 stroke-2 fill-none filter drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" 
              style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
            />
          )}
          {expensePoints.length > 0 && (
            <path 
              d={expenseLine} 
              className="stroke-fuchsia-400 stroke-2 fill-none filter drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]" 
              style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
            />
          )}

          {/* Point markers & Mouse intercept triggers */}
          {dailyBreakdown.map((d, index) => {
            const x = padding.left + (index / Math.max(1, dailyBreakdown.length - 1)) * plotWidth;
            const incY = incomePoints[index]?.y || 0;
            const expY = expensePoints[index]?.y || 0;
            const isHovered = hoveredIdx === index;

            return (
              <g key={index}>
                {index % Math.max(1, Math.floor(dailyBreakdown.length / 8)) === 0 || isHovered ? (
                  <>
                    {incomePoints[index] && incomePoints[index].value > 0 && (
                      <circle 
                        cx={x} 
                        cy={incY} 
                        r={isHovered ? 5.5 : 3.5} 
                        className={`fill-emerald-400 stroke-slate-950 stroke-2 transition-all ${isHovered ? 'shadow-xl' : ''}`}
                      />
                    )}
                    {expensePoints[index] && expensePoints[index].value > 0 && (
                      <circle 
                        cx={x} 
                        cy={expY} 
                        r={isHovered ? 5.5 : 3.5} 
                        className={`fill-fuchsia-400 stroke-slate-950 stroke-2 transition-all ${isHovered ? 'shadow-xl' : ''}`}
                      />
                    )}
                  </>
                ) : null}

                {/* Column block to trigger hover easily */}
                <rect 
                  x={x - (plotWidth / Math.max(1, dailyBreakdown.length - 1)) / 2} 
                  y={padding.top} 
                  width={plotWidth / Math.max(1, dailyBreakdown.length - 1)} 
                  height={plotHeight} 
                  className="fill-transparent hover:fill-white/[0.02] cursor-crosshair"
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Date labels on X Axis */}
                {(index % 2 === 0 || isHovered) && (
                  <text 
                    x={x} 
                    y={height - 12} 
                    textAnchor="middle" 
                    className={`font-mono text-[8px] tracking-tighter ${isHovered ? 'fill-cyan-400 font-extrabold' : 'fill-slate-500'}`}
                  >
                    {d.date.substring(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend identifiers */}
      <div className="flex justify-center items-center gap-6 mt-2 pt-1 pb-1 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-1.5 bg-emerald-400 rounded-sm"></span>
          <span>Income 📈</span>
        </div>
        <div className="flex items-center gap-1.5 text-fuchsia-400">
          <span className="w-2.5 h-1.5 bg-fuchsia-400 rounded-sm"></span>
          <span>Expense 📉</span>
        </div>
      </div>
    </div>
  );
}

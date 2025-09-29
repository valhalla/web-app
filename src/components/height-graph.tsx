import React, { useMemo, useState, useCallback } from 'react';

export interface HeightPoint {
  d: number; // distance (meters)
  h: number; // elevation (meters)
}

interface HeightGraphProps {
  series: HeightPoint[];
  width?: number;
  height?: number;
  onHoverIndex?: (index: number) => void;
  onLeave?: () => void;
}

// Keep thresholds aligned with utils/heightgraph.ts
const deriveHeightClass = (
  slope: number
): -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 => {
  if (slope < -15) return -5;
  if (slope < -10) return -4;
  if (slope < -7) return -3;
  if (slope < -4) return -2;
  if (slope < -1) return -1;
  if (slope < 1) return 0;
  if (slope < 3) return 1;
  if (slope < 6) return 2;
  if (slope < 9) return 3;
  if (slope < 15) return 4;
  return 5;
};

// Colors roughly aligned with utils/colorMappings steepness
const CLASS_COLORS: Record<string, string> = {
  '-5': '#028306',
  '-4': '#2AA12E',
  '-3': '#53BF56',
  '-2': '#7BDD7E',
  '-1': '#A4FBA6',
  '0': '#ffcc99',
  '1': '#F29898',
  '2': '#E07575',
  '3': '#CF5352',
  '4': '#BE312F',
  '5': '#AD0F0C',
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const HeightGraph: React.FC<HeightGraphProps> = ({
  series,
  width = 620,
  height = 130,
  onHoverIndex,
  onLeave,
}) => {
  const pad = 6;

  const maxD = useMemo(
    () => (series.length ? Math.max(...series.map((p) => p.d)) : 1),
    [series]
  );
  const minH = useMemo(
    () => (series.length ? Math.min(...series.map((p) => p.h)) : 0),
    [series]
  );
  const maxH = useMemo(
    () => (series.length ? Math.max(...series.map((p) => p.h)) : 1),
    [series]
  );

  const sx = useCallback(
    (d: number) => pad + (d / (maxD || 1)) * (width - 2 * pad),
    [width, maxD]
  );
  const sy = useCallback(
    (y: number) =>
      pad + (1 - (y - minH) / (maxH - minH || 1)) * (height - 2 * pad),
    [height, minH, maxH]
  );

  // Build elevation path
  const path = useMemo(() => {
    if (!series.length) return '';
    return series
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.d)},${sy(p.h)}`)
      .join(' ');
  }, [series, sx, sy]);

  // Build colored slope segments as quads between consecutive points
  const segments = useMemo(() => {
    const segs: {
      x1: number;
      x2: number;
      y1: number;
      y2: number;
      color: string;
    }[] = [];
    for (let i = 0; i < series.length - 1; i++) {
      const p = series[i]!;
      const n = series[i + 1]!;
      const rise = n.h - p.h;
      const run = n.d - p.d;
      const slope = (rise / (run || 1)) * 100;
      const cls = deriveHeightClass(isFinite(slope) ? slope : 0);
      segs.push({
        x1: sx(p.d),
        x2: sx(n.d),
        y1: sy(p.h),
        y2: sy(n.h),
        color: CLASS_COLORS[String(cls)]!,
      });
    }
    return segs;
  }, [series, sx, sy]);

  const [hoverX, setHoverX] = useState<number | null>(null);

  const handleMouseMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    const rect = (e.target as SVGElement)
      .closest('svg')!
      .getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, pad, width - pad);
    setHoverX(x);
    const dist = ((x - pad) / (width - 2 * pad)) * maxD;
    // find nearest segment start index
    let idx = 0;
    for (let i = 0; i < series.length - 1; i++) {
      if (series[i]!.d <= dist && dist <= series[i + 1]!.d) {
        idx = i;
        break;
      }
      if (dist > series[i + 1]!.d) idx = i + 1;
    }
    if (onHoverIndex) onHoverIndex(idx);
  };

  const handleMouseLeave: React.MouseEventHandler<SVGSVGElement> = () => {
    setHoverX(null);
    onLeave?.();
  };

  const baseY = sy(minH);

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Colored segment areas */}
      {segments.map((s, i) => (
        <path
          key={i}
          d={`M${s.x1},${baseY} L${s.x1},${s.y1} L${s.x2},${s.y2} L${s.x2},${baseY} Z`}
          fill={s.color}
          opacity={0.35}
          stroke="none"
        />
      ))}
      {/* Elevation line */}
      <path d={path} fill="none" stroke="#007cbf" strokeWidth={2} />
      {/* Hover cursor */}
      {hoverX !== null && (
        <line
          x1={hoverX}
          y1={pad}
          x2={hoverX}
          y2={height - pad}
          stroke="#111"
          strokeDasharray="3,3"
        />
      )}
    </svg>
  );
};
export default HeightGraph;

import React, { useMemo, useId } from 'react';

const PADDING = { top: 20, right: 20, bottom: 30, left: 20 };
const WIDTH = 400;


interface ChartLineProps {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
}

export const ChartLine: React.FC<ChartLineProps> = ({
  data,
  labels = [],
  height = 200,
  color = 'var(--color-primary)',
}) => {
  const chartId = useId();

  const points = useMemo(() => {
    if (data.length === 0) return [];

    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;

    const chartWidth = WIDTH - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    return data.map((val, i) => ({
      x: PADDING.left + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2),
      y: PADDING.top + chartHeight - ((val - minVal) / range) * chartHeight,
      value: val,
    }));
  }, [data, height]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const chartBottom = height - PADDING.bottom;
    let d = `M ${points[0].x},${chartBottom}`;
    points.forEach((p) => {
      d += ` L ${p.x},${p.y}`;
    });
    d += ` L ${points[points.length - 1].x},${chartBottom} Z`;
    return d;
  }, [points, height]);

  const gradientId = `chart-gradient-${chartId}`;

  if (data.length === 0) return null;


  return (
    <div className="chart-container">
      <svg
        width="100%"
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="chart-line-svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          className="chart-area"
        />

        <polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="chart-polyline"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={color}
            className="chart-dot"
          />
        ))}

        {labels.map((label, i) => {
          if (i >= points.length) return null;
          return (
            <text
              key={i}
              x={points[i].x}
              y={height - 8}
              textAnchor="middle"
              className="chart-label"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

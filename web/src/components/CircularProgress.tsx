import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  centerValue?: string;
  centerLabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 200,
  strokeWidth = 8,
  accentColor = 'var(--primary)',
  centerValue,
  centerLabel,
}) => {
  const [mounted, setMounted] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="progress-circle-container">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="circular-progress-svg"
      >
        <defs>
          <filter id="progress-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={accentColor} floodOpacity="0.6" />
          </filter>
        </defs>
        <circle
          className="progress-circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className="progress-circle-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={accentColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: mounted ? strokeDashoffset : circumference,
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#progress-glow)"
        />
      </svg>
      <div className="progress-circle-text">
        {centerValue && <span className="circular-progress-value text-glow">{centerValue}</span>}
        {centerLabel && <span className="circular-progress-label">{centerLabel}</span>}
      </div>
    </div>
  );
};

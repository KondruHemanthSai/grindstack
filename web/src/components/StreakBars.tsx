import React from 'react';

interface StreakBarsProps {
  data: boolean[];
}

const ACTIVE_HEIGHTS = [16, 20, 18, 24, 20, 22, 16];

export const StreakBars: React.FC<StreakBarsProps> = ({ data }) => {
  const bars = data.slice(0, 7);

  return (
    <div className="streak-bars">
      {bars.map((active, i) => (
        <div
          key={i}
          className={`streak-bar ${active ? 'active' : 'inactive'}`}
          style={{ height: active ? ACTIVE_HEIGHTS[i] : 8 }}
        />
      ))}
    </div>
  );
};

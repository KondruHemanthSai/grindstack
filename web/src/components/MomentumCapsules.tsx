import React, { useMemo } from 'react';

interface MomentumDay {
  dateString: string;
  label: string;
  isToday: boolean;
  completionLevel: number;
}

interface MomentumCapsulesProps {
  days: MomentumDay[];
}

const getCompletionClass = (level: number): string => {
  if (level === 0) return 'missed';
  return 'active';
};

const getOpacityStyle = (level: number): React.CSSProperties => {
  if (level === 0) return {};
  if (level >= 4) return { opacity: 1 };
  const opacityMap: Record<number, number> = { 1: 0.4, 2: 0.6, 3: 0.8 };
  return { opacity: opacityMap[level] ?? 1 };
};

export const MomentumCapsules: React.FC<MomentumCapsulesProps> = ({ days }) => {
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...days].sort((a, b) => b.dateString.localeCompare(a.dateString));
    for (const day of sorted) {
      if (day.completionLevel > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [days]);

  return (
    <div className="momentum-container">
      <div className="momentum-grid">
        {days.map((day) => (
          <div
            key={day.dateString}
            className={`momentum-capsule ${getCompletionClass(day.completionLevel)} ${day.isToday ? 'today' : ''}`}
            style={getOpacityStyle(day.completionLevel)}
            title={`${day.label} - ${day.dateString}`}
          >
            <span className="momentum-capsule-label">{day.label}</span>
          </div>
        ))}
      </div>
      <div className="momentum-streak">
        <span className="momentum-streak-count">{currentStreak}</span>
        <span className="momentum-streak-label">day streak</span>
      </div>
    </div>
  );
};

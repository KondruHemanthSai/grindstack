import React from 'react';

interface FocusTimerProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalMinutes: number;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({
  minutes,
  seconds,
  isRunning,
  totalMinutes,
}) => {
  const size = 260;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const totalSeconds = totalMinutes * 60;
  const elapsedSeconds = totalSeconds - (minutes * 60 + seconds);
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const displayMinutes = String(minutes).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');

  return (
    <div className={`focus-timer ${isRunning ? 'running' : ''}`}>
      <div className="focus-timer-ring">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="focus-timer-svg"
        >
          <circle
            className="focus-timer-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            className="focus-timer-progress"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="focus-timer-value">
          {displayMinutes}:{displaySeconds}
        </div>
      </div>
      <div className="focus-timer-fraction">
        {elapsedSeconds > 0 ? Math.floor(elapsedSeconds / 60) : 0} / {totalMinutes} min
      </div>
    </div>
  );
};

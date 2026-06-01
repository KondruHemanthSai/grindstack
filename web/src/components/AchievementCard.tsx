import React from 'react';

interface AchievementCardProps {
  title: string;
  description: string;
  tier: 1 | 2 | 3;
  progress: number;
  current: number;
  target: number;
  unlocked: boolean;
  category: string;
}

const TIER_LABELS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
};

const CATEGORY_ICONS: Record<string, string> = {
  focus: 'timer',
  streak: 'local_fire_department',
  tasks: 'task_alt',
  wellness: 'favorite',
  social: 'group',
  mastery: 'emoji_events',
};

const getStatusText = (progress: number): string => {
  if (progress >= 100) return 'MASTERED';
  if (progress > 0) return 'IN PROGRESS';
  return 'INITIATED';
};

export const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  description,
  tier,
  progress,
  current,
  target,
  unlocked,
  category,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const statusText = getStatusText(clampedProgress);
  const categoryIcon = CATEGORY_ICONS[category] || 'emoji_events';

  return (
    <div className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
      <div className="badge-tier" data-tier={tier}>
        {TIER_LABELS[tier]}
      </div>
      <div className="achievement-icon-circle">
        <span className="material-symbols-outlined">{categoryIcon}</span>
      </div>
      <div className="achievement-info">
        <h3 className={`achievement-title ${unlocked ? 'unlocked' : ''}`}>{title}</h3>
        <p className="achievement-description">{description}</p>
        <div className="achievement-progress-bar">
          <div
            className="achievement-progress-fill"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        <div className="achievement-meta">
          <span className="achievement-count">{current} / {target}</span>
          <span className="achievement-status">{statusText}</span>
        </div>
      </div>
    </div>
  );
};

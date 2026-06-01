import React from 'react';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend,
  trendPositive,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="metric-label label-caps">{label}</div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${trendPositive ? 'positive' : 'negative'}`}>
          {trend}
        </div>
      )}
    </div>
  );
};

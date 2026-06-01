import React from 'react';

interface InsightCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  label,
  value,
  description,
  icon,
}) => {
  return (
    <div className="insight-card">
      <div className="insight-card-header">
        <span className="material-symbols-outlined insight-card-icon">{icon}</span>
        <span className="insight-card-label label-caps">{label}</span>
      </div>
      <div className="insight-card-value">{value}</div>
      <p className="insight-card-description">{description}</p>
    </div>
  );
};

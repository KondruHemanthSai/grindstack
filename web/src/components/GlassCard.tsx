import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  variant?: 'default' | 'elevated' | 'interactive';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, style, variant = 'default' }) => {
  const variantClass = variant === 'elevated' ? 'glass-card-elevated' : variant === 'interactive' ? 'glass-card-interactive' : '';
  return (
    <div className={`glass-card ${variantClass} ${className}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', ...style }}>
      {children}
    </div>
  );
};

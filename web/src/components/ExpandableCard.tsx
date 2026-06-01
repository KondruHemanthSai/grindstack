import React, { useState, useRef, useEffect } from 'react';

interface ExpandableCardProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  icon: string;
  accentColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  badge,
  badgeColor,
  icon,
  accentColor,
  children,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded]);

  return (
    <div className={`expandable-card ${expanded ? 'expanded' : ''}`}>
      <button
        className="card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="card-header-left">
          <span
            className="material-symbols-outlined card-header-icon"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {icon}
          </span>
          <span className="card-header-title">{title}</span>
          {badge && (
            <span className={`card-header-badge ${badgeColor || ''}`}>
              {badge}
            </span>
          )}
        </div>
        <span className={`material-symbols-outlined card-chevron ${expanded ? 'expanded' : ''}`}>
          expand_more
        </span>
      </button>
      <div
        className="card-content"
        style={{ maxHeight: expanded ? contentHeight : 0 }}
      >
        <div ref={contentRef} className="card-content-inner">
          {children}
        </div>
      </div>
    </div>
  );
};

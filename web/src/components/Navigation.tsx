import React from 'react';
import { LayoutDashboard, Target, BarChart3, User } from 'lucide-react';

export type ScreenType = 'home' | 'mission' | 'insights' | 'profile';

interface NavigationProps {
  activeScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

interface NavTab {
  screen: ScreenType;
  icon: React.ReactNode;
  label: string;
}

const tabs: NavTab[] = [
  { screen: 'home', icon: <LayoutDashboard size={20} />, label: 'HOME' },
  { screen: 'mission', icon: <Target size={20} />, label: 'MISSION' },
  { screen: 'insights', icon: <BarChart3 size={20} />, label: 'INSIGHTS' },
  { screen: 'profile', icon: <User size={20} />, label: 'PROFILE' },
];

export const Navigation: React.FC<NavigationProps> = ({ activeScreen, onNavigate }) => {
  return (
    <nav className="nav-bar">
      {tabs.map((tab) => (
        <button
          key={tab.screen}
          className={`nav-item ${activeScreen === tab.screen ? 'active' : ''}`}
          onClick={() => onNavigate(tab.screen)}
        >
          <span className="nav-icon">
            {tab.icon}
          </span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

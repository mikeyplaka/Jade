import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, HardHat, ListChecks, Bell } from 'lucide-react';

const tabs = [
  { path: '/Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/MyWork', label: 'My Work', icon: HardHat },
  { path: '/Tasks', label: 'Tasks', icon: ListChecks },
  { path: '/Notifications', label: 'Alerts', icon: Bell },
];

export default function MobileTabBar({ unreadCount = 0 }) {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(tab => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors select-none relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
            {tab.path === '/Notifications' && unreadCount > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-10px)] w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
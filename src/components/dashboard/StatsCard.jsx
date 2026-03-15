import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'bg-primary/10 text-primary', to }) {
  const content = (
    <Card className={`p-5 hover:shadow-md transition-shadow ${to ? 'cursor-pointer hover:border-primary/40' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );

  if (to) return <Link to={to}>{content}</Link>;
  return content;
}
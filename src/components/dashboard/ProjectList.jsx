import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-slate-100 text-slate-600',
};

const priorityDots = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function ProjectList({ projects, title = 'Recent Projects' }) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
        )}
        {projects.slice(0, 5).map(project => (
          <Link
            key={project.id}
            to={`/ProjectDetail?id=${project.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDots[project.priority] || 'bg-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{project.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.address}
                </span>
                {project.deadline && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {format(new Date(project.deadline), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`text-xs ${statusColors[project.status] || 'bg-slate-100 text-slate-600'}`}>
              {project.status?.replace('_', ' ')}
            </Badge>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
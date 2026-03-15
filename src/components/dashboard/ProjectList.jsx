import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
  on_hold: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
};

const priorityDots = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500 dark:shadow-[0_0_8px_rgba(239,68,68,0.5)]',
};

export default function ProjectList({ projects, title = 'Recent Projects' }) {
  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground/80">{title}</h3>
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
          {projects.length} Total
        </Badge>
      </div>
      <div className="space-y-2">
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 bg-card rounded-2xl border border-dashed border-muted-foreground/20">
            <p className="text-sm text-muted-foreground">No projects found</p>
          </div>
        )}
        {projects.slice(0, 5).map(project => (
          <Link
            key={project.id}
            to={`/ProjectDetail?id=${project.id}`}
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-transparent hover:border-primary/20 hover:shadow-sm transition-all duration-300 group"
          >
            <div className={cn(
              "w-1.5 h-8 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-y-110",
              priorityDots[project.priority] || 'bg-slate-200'
            )} />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{project.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 opacity-70">
                  <MapPin className="w-3 h-3 text-primary/60" />
                  {project.address || 'No address'}
                </span>
                {project.deadline && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 opacity-70">
                    <CalendarDays className="w-3 h-3 text-primary/60" />
                    {format(new Date(project.deadline), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant="default" className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-none",
                statusColors[project.status] || 'bg-slate-500/10 text-slate-600'
              )}>
                {project.status?.replace('_', ' ')}
              </Badge>
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/30 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
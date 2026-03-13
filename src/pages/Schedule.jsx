import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { Link } from 'react-router-dom';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  on_hold: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getItemsForDay = (day) => {
    const dayProjects = projects.filter(p => {
      if (!p.start_date && !p.deadline) return false;
      const start = p.start_date ? parseISO(p.start_date) : null;
      const end = p.deadline ? parseISO(p.deadline) : null;
      if (start && end) return day >= start && day <= end;
      if (start) return isSameDay(day, start);
      if (end) return isSameDay(day, end);
      return false;
    });

    const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));

    return { projects: dayProjects, tasks: dayTasks };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {format(currentWeek, 'MMM d')} – {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const items = getItemsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`min-h-[200px] rounded-xl border p-3 ${isToday ? 'border-primary bg-primary/5' : 'bg-card'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</span>
                <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
              </div>
              <div className="space-y-1.5">
                {items.projects.map(p => (
                  <Link key={p.id} to={`/ProjectDetail?id=${p.id}`} className={`block text-xs p-1.5 rounded border ${statusColors[p.status]}`}>
                    <p className="font-medium truncate">{p.name}</p>
                  </Link>
                ))}
                {items.tasks.map(t => (
                  <div key={t.id} className="text-xs p-1.5 rounded bg-muted">
                    <p className="truncate">{t.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Day List */}
      <div className="lg:hidden space-y-3">
        {weekDays.map((day) => {
          const items = getItemsForDay(day);
          const isToday = isSameDay(day, new Date());
          const hasItems = items.projects.length > 0 || items.tasks.length > 0;
          return (
            <Card key={day.toISOString()} className={`p-4 ${isToday ? 'border-primary' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <span className="text-[10px] font-medium leading-none">{format(day, 'EEE')}</span>
                  <span className="text-sm font-bold leading-none mt-0.5">{format(day, 'd')}</span>
                </div>
                <span className="text-sm font-medium">{format(day, 'MMMM d')}</span>
                {hasItems && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.projects.length + items.tasks.length} items
                  </Badge>
                )}
              </div>
              {hasItems ? (
                <div className="space-y-2 ml-13">
                  {items.projects.map(p => (
                    <Link key={p.id} to={`/ProjectDetail?id=${p.id}`} className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-xs font-medium flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}</span>
                    </Link>
                  ))}
                  {items.tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      <span className="text-xs flex-1 truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground ml-13">No scheduled items</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
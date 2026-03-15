import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock, Wrench, RefreshCw } from 'lucide-react';
import { differenceInDays, parseISO, format, addDays } from 'date-fns';
import { toast } from 'sonner';

export default function MaintenancePanel({ equipment, projects }) {
  const queryClient = useQueryClient();
  const [runningCheck, setRunningCheck] = useState(false);

  const today = new Date();

  const items = equipment
    .filter(e => e.next_maintenance_date)
    .map(e => {
      const diff = differenceInDays(parseISO(e.next_maintenance_date), today);
      return { ...e, diff };
    })
    .sort((a, b) => a.diff - b.diff);

  const overdue = items.filter(e => e.diff < 0);
  const dueSoon = items.filter(e => e.diff >= 0 && e.diff <= 14);
  const upcoming = items.filter(e => e.diff > 14 && e.diff <= 60);

  const completeMaintenance = useMutation({
    mutationFn: async (item) => {
      const today = new Date();
      const nextDate = addDays(today, item.maintenance_interval_days || 90);
      return base44.entities.Equipment.update(item.id, {
        last_maintenance_date: format(today, 'yyyy-MM-dd'),
        next_maintenance_date: format(nextDate, 'yyyy-MM-dd'),
        status: item.status === 'maintenance' ? 'available' : item.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Maintenance recorded');
    },
  });

  const runAlertCheck = async () => {
    setRunningCheck(true);
    try {
      await base44.functions.invoke('checkMaintenanceAlerts', {});
      toast.success('Maintenance alerts sent to managers');
    } catch (e) {
      toast.error('Failed to run alert check');
    }
    setRunningCheck(false);
  };

  const Section = ({ title, items, icon: Icon, color, alertColor }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h3 className={`text-sm font-semibold ${color}`}>{title} ({items.length})</h3>
        </div>
        <div className="space-y-2">
          {items.map(item => {
            const project = projects.find(p => p.id === item.assigned_to_project);
            return (
              <Card key={item.id} className={`p-4 border-l-4 ${alertColor}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.diff < 0
                        ? `Overdue by ${Math.abs(item.diff)} days`
                        : item.diff === 0
                        ? 'Due today'
                        : `Due in ${item.diff} days`}
                      {' · '}Scheduled: {format(parseISO(item.next_maintenance_date), 'MMM d, yyyy')}
                    </p>
                    {project && (
                      <p className="text-xs text-muted-foreground mt-0.5">📍 {project.name}</p>
                    )}
                    {item.maintenance_notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{item.maintenance_notes}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs gap-1.5"
                    onClick={() => completeMaintenance.mutate(item)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Done
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{overdue.length + dueSoon.length} items need attention</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={runAlertCheck} disabled={runningCheck}>
          <RefreshCw className={`w-4 h-4 ${runningCheck ? 'animate-spin' : ''}`} />
          Send Alerts
        </Button>
      </div>

      {overdue.length === 0 && dueSoon.length === 0 && upcoming.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
          <p className="text-muted-foreground">All equipment is up to date</p>
        </Card>
      ) : (
        <>
          <Section title="Overdue" items={overdue} icon={AlertTriangle} color="text-red-600" alertColor="border-red-400" />
          <Section title="Due Soon (≤14 days)" items={dueSoon} icon={Clock} color="text-amber-600" alertColor="border-amber-400" />
          <Section title="Upcoming (15–60 days)" items={upcoming} icon={Wrench} color="text-blue-600" alertColor="border-blue-300" />
        </>
      )}
    </div>
  );
}
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Pencil, Trash2, MapPin, User, AlertTriangle, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';

const statusConfig = {
  available: { label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  in_use: { label: 'In Use', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
  out_of_service: { label: 'Out of Service', color: 'bg-red-100 text-red-700' },
  reserved: { label: 'Reserved', color: 'bg-purple-100 text-purple-700' },
};

const typeIcons = {
  heavy_machinery: '🏗️',
  vehicle: '🚛',
  power_tool: '⚡',
  tool: '🔧',
  safety_equipment: '🦺',
  other: '📦',
};

export default function EquipmentCard({ item, projects, users, onEdit, onDelete }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.update(item.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }),
  });

  const assignedProject = projects.find(p => p.id === item.assigned_to_project);
  const assignedUser = users.find(u => u.email === item.assigned_to_employee);

  const maintenanceAlert = () => {
    if (!item.next_maintenance_date) return null;
    const diff = differenceInDays(parseISO(item.next_maintenance_date), new Date());
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'text-red-600 bg-red-50' };
    if (diff <= 7) return { label: `Due in ${diff}d`, color: 'text-red-600 bg-red-50' };
    if (diff <= 14) return { label: `Due in ${diff}d`, color: 'text-amber-600 bg-amber-50' };
    return null;
  };

  const alert = maintenanceAlert();

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcons[item.type] || '📦'}</span>
          <div>
            <p className="font-semibold text-sm">{item.name}</p>
            {item.brand && <p className="text-xs text-muted-foreground">{item.brand} {item.model}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Status Selector */}
      <Select value={item.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
        <SelectTrigger className="h-7 text-xs w-auto border-0 p-0 focus:ring-0 shadow-none gap-1">
          <Badge className={statusConfig[item.status]?.color || 'bg-slate-100 text-slate-600'}>
            {statusConfig[item.status]?.label || item.status}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusConfig).map(([val, cfg]) => (
            <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assignment Info */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {assignedProject && (
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> {assignedProject.name}
          </p>
        )}
        {assignedUser && (
          <p className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> {assignedUser.full_name || assignedUser.email}
          </p>
        )}
        {item.serial_number && (
          <p className="text-xs text-muted-foreground">S/N: {item.serial_number}</p>
        )}
      </div>

      {/* Maintenance Alert */}
      {alert && (
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded ${alert.color}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Maintenance: {alert.label}
        </div>
      )}

      {item.next_maintenance_date && !alert && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Next service: {format(parseISO(item.next_maintenance_date), 'MMM d, yyyy')}
        </p>
      )}
    </Card>
  );
}
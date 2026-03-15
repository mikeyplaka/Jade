import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle2, Clock, Package } from 'lucide-react';
import EquipmentCard from '@/components/equipment/EquipmentCard';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import MaintenancePanel from '@/components/equipment/MaintenancePanel';
import { differenceInDays, parseISO } from 'date-fns';

const statusConfig = {
  available: { label: 'Available', color: 'bg-emerald-100 text-emerald-700' },
  in_use: { label: 'In Use', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
  out_of_service: { label: 'Out of Service', color: 'bg-red-100 text-red-700' },
  reserved: { label: 'Reserved', color: 'bg-purple-100 text-purple-700' },
};

export default function Equipment() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipment'] }),
  });

  const today = new Date();
  const alertItems = equipment.filter(e => {
    if (!e.next_maintenance_date) return false;
    const diff = differenceInDays(parseISO(e.next_maintenance_date), today);
    return diff <= 14;
  });

  const filtered = equipment.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.brand?.toLowerCase().includes(search.toLowerCase()) ||
      e.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    in_use: equipment.filter(e => e.status === 'in_use').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    alerts: alertItems.length,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipment & Tools</h1>
          <p className="text-sm text-muted-foreground">{stats.total} items tracked</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Equipment
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Available', value: stats.available, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'In Use', value: stats.in_use, icon: Wrench, color: 'text-blue-600' },
          { label: 'Maintenance', value: stats.maintenance, icon: Clock, color: 'text-amber-600' },
          { label: 'Alerts', value: stats.alerts, icon: AlertTriangle, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            Maintenance
            {alertItems.length > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">{alertItems.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'available', 'in_use', 'maintenance', 'out_of_service'].map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize text-xs"
                >
                  {s === 'all' ? 'All' : statusConfig[s]?.label || s}
                </Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No equipment found</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>Add Equipment</Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(item => (
                <EquipmentCard
                  key={item.id}
                  item={item}
                  projects={projects}
                  users={users}
                  onEdit={() => { setEditItem(item); setShowForm(true); }}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <MaintenancePanel equipment={equipment} projects={projects} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      {showForm && (
        <EquipmentForm
          item={editItem}
          projects={projects}
          users={users}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            setShowForm(false);
            setEditItem(null);
          }}
        />
      )}
    </div>
  );
}
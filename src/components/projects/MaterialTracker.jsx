import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Package, Minus, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

const categoryColors = {
  concrete: 'bg-stone-100 text-stone-700',
  lumber: 'bg-amber-100 text-amber-700',
  steel: 'bg-slate-100 text-slate-700',
  electrical: 'bg-yellow-100 text-yellow-700',
  plumbing: 'bg-blue-100 text-blue-700',
  insulation: 'bg-orange-100 text-orange-700',
  drywall: 'bg-gray-100 text-gray-700',
  flooring: 'bg-lime-100 text-lime-700',
  roofing: 'bg-red-100 text-red-700',
  hardware: 'bg-purple-100 text-purple-700',
  other: 'bg-muted text-muted-foreground',
};

const CATEGORIES = ['concrete','lumber','steel','electrical','plumbing','insulation','drywall','flooring','roofing','hardware','other'];
const UNITS = ['pcs', 'lbs', 'ft', 'ft²', 'ft³', 'bags', 'boxes', 'rolls', 'sheets', 'gal', 'yd', 'm', 'kg', 'tons'];

const defaultForm = { name: '', unit: 'pcs', quantity_total: '', quantity_installed: '0', category: 'other', notes: '' };

export default function MaterialTracker({ projectId, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [expandedId, setExpandedId] = useState(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['projectMaterials', projectId],
    queryFn: () => base44.entities.ProjectMaterial.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMaterial.create({ ...data, project_id: projectId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] }); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectMaterial.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectMaterial.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectMaterials', projectId] }),
  });

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm(defaultForm); };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit || 'pcs',
      quantity_total: String(item.quantity_total),
      quantity_installed: String(item.quantity_installed || 0),
      category: item.category || 'other',
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      quantity_total: parseFloat(form.quantity_total) || 0,
      quantity_installed: parseFloat(form.quantity_installed) || 0,
    };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload });
      closeForm();
    } else {
      createMutation.mutate(payload);
    }
  };

  const adjustInstalled = (item, delta) => {
    const newVal = Math.max(0, Math.min(item.quantity_total, (item.quantity_installed || 0) + delta));
    updateMutation.mutate({ id: item.id, data: { quantity_installed: newVal } });
  };

  // Summary stats
  const totalItems = materials.length;
  const fullyInstalled = materials.filter(m => m.quantity_installed >= m.quantity_total).length;
  const lowStock = materials.filter(m => {
    const rem = m.quantity_total - (m.quantity_installed || 0);
    return rem <= m.quantity_total * 0.1 && m.quantity_installed < m.quantity_total;
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Site Materials</h2>
          {totalItems > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {fullyInstalled}/{totalItems} fully installed
              {lowStock > 0 && <span className="text-amber-600 ml-2">· {lowStock} low stock</span>}
            </p>
          )}
        </div>
        <Button size="sm" className="gap-1" onClick={() => { setShowForm(true); setEditItem(null); setForm(defaultForm); }}>
          <Plus className="w-3.5 h-3.5" /> Add Material
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-4 text-center">Loading materials...</p>}

      {!isLoading && materials.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No materials tracked yet</p>
          <p className="text-xs mt-1">Add materials to track delivery vs. installation progress</p>
        </div>
      )}

      <div className="space-y-2">
        {materials.map((item) => {
          const remaining = item.quantity_total - (item.quantity_installed || 0);
          const pct = item.quantity_total > 0 ? Math.round(((item.quantity_installed || 0) / item.quantity_total) * 100) : 0;
          const isExpanded = expandedId === item.id;
          const isFullyInstalled = remaining <= 0;
          const isLow = remaining > 0 && remaining <= item.quantity_total * 0.1;

          return (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Badge className={`text-[10px] px-1.5 py-0 ${categoryColors[item.category || 'other']}`}>
                      {item.category}
                    </Badge>
                    {isFullyInstalled && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">Fully Installed</Badge>}
                    {isLow && <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Low Stock</Badge>}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isFullyInstalled ? 'bg-emerald-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.quantity_installed || 0}/{item.quantity_total} {item.unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{remaining} remaining</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded controls */}
              {isExpanded && (
                <div className="border-t bg-muted/20 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p><span className="font-medium text-foreground">{item.quantity_total} {item.unit}</span> total delivered</p>
                      <p><span className="font-medium text-emerald-600">{item.quantity_installed || 0} {item.unit}</span> installed</p>
                      <p><span className="font-medium text-amber-600">{remaining} {item.unit}</span> remaining on site</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Update installed:</span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustInstalled(item, -1)}>
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-sm font-medium w-10 text-center">{item.quantity_installed || 0}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustInstalled(item, 1)}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground bg-background rounded p-2 border">{item.notes}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => openEdit(item)}>
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="outline" className="gap-1 h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Material' : 'Add Material'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Material Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Cement Bags, 2x4 Lumber"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Quantity Delivered *</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity_total}
                  onChange={e => setForm(p => ({ ...p, quantity_total: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Already Installed</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity_installed}
                  onChange={e => setForm(p => ({ ...p, quantity_installed: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Supplier info, location on site, etc."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit">{editItem ? 'Save Changes' : 'Add Material'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
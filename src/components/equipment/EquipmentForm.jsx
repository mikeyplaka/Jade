import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const defaultForm = {
  name: '', type: 'tool', brand: '', model: '', serial_number: '',
  status: 'available', condition: 'good',
  assigned_to_employee: '', assigned_to_project: '',
  location: '', purchase_date: '', purchase_price: '',
  last_maintenance_date: '', next_maintenance_date: '',
  maintenance_interval_days: 90, maintenance_notes: '', notes: '',
};

export default function EquipmentForm({ item, projects, users, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...defaultForm, ...item } : defaultForm);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form };
    if (data.purchase_price) data.purchase_price = parseFloat(data.purchase_price);
    if (data.maintenance_interval_days) data.maintenance_interval_days = parseInt(data.maintenance_interval_days);
    if (!data.assigned_to_employee) delete data.assigned_to_employee;
    if (!data.assigned_to_project) delete data.assigned_to_project;

    if (item?.id) {
      await base44.entities.Equipment.update(item.id, data);
    } else {
      await base44.entities.Equipment.create(data);
    }
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Equipment Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Excavator CAT 320" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="power_tool">Power Tool</SelectItem>
                  <SelectItem value="heavy_machinery">Heavy Machinery</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="out_of_service">Out of Service</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Caterpillar" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. 320" />
            </div>
            <div className="space-y-1.5">
              <Label>Serial / Asset Number</Label>
              <Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="SN-12345" />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => set('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold">Assignment</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assign to Employee</Label>
                <Select value={form.assigned_to_employee || 'none'} onValueChange={v => set('assigned_to_employee', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Assign to Project</Label>
                <Select value={form.assigned_to_project || 'none'} onValueChange={v => set('assigned_to_project', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Current Location</Label>
                <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Warehouse B, Job Site A" />
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold">Maintenance Schedule</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Last Maintenance Date</Label>
                <Input type="date" value={form.last_maintenance_date} onChange={e => set('last_maintenance_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Next Maintenance Date</Label>
                <Input type="date" value={form.next_maintenance_date} onChange={e => set('next_maintenance_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Maintenance Interval (days)</Label>
                <Input type="number" value={form.maintenance_interval_days} onChange={e => set('maintenance_interval_days', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Maintenance Notes</Label>
              <Textarea value={form.maintenance_notes} onChange={e => set('maintenance_notes', e.target.value)} rows={2} placeholder="Service history, notes..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>General Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : item ? 'Save Changes' : 'Add Equipment'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
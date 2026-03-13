import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProjectForm({ open, onClose, onSubmit, initialData, employees = [] }) {
  const [form, setForm] = useState(initialData || {
    name: '', address: '', apartment_number: '', description: '',
    scope_of_work: '', materials_needed: '', start_date: '', deadline: '',
    priority: 'medium', status: 'pending', assigned_employees: [], project_manager: '',
    notes: '', latitude: null, longitude: null,
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const toggleEmployee = (email) => {
    const current = form.assigned_employees || [];
    const updated = current.includes(email)
      ? current.filter(e => e !== email)
      : [...current, email];
    handleChange('assigned_employees', updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input value={form.name} onChange={e => handleChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={form.address} onChange={e => handleChange('address', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Apartment / Unit #</Label>
                <Input value={form.apartment_number} onChange={e => handleChange('apartment_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => handleChange('priority', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => handleChange('start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => handleChange('deadline', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project Manager</Label>
                <Select value={form.project_manager || ''} onValueChange={v => handleChange('project_manager', v)}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    {employees.filter(e => e.role === 'project_manager' || e.role === 'admin').map(e => (
                      <SelectItem key={e.email} value={e.email}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Scope of Work</Label>
              <Textarea value={form.scope_of_work} onChange={e => handleChange('scope_of_work', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Materials Needed</Label>
              <Textarea value={form.materials_needed} onChange={e => handleChange('materials_needed', e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Assign Employees</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border rounded-lg p-3">
                {employees.filter(e => e.role === 'employee').map(emp => (
                  <label key={emp.email} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                    <input
                      type="checkbox"
                      checked={(form.assigned_employees || []).includes(emp.email)}
                      onChange={() => toggleEmployee(emp.email)}
                      className="rounded"
                    />
                    {emp.full_name}
                  </label>
                ))}
                {employees.filter(e => e.role === 'employee').length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2 text-center py-2">No employees found</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">{initialData ? 'Update Project' : 'Create Project'}</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
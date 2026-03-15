import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Package, Plus, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  ordered: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  ordered: Truck,
  delivered: CheckCircle2,
  rejected: XCircle,
};

export default function MaterialRequests({ projectId, user, isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ material: '', quantity: '', notes: '', priority: 'normal' });

  const { data: requests = [] } = useQuery({
    queryKey: ['materialRequests', projectId],
    queryFn: () => base44.entities.MaterialRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MaterialRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialRequests', projectId] });
      setShowForm(false);
      setForm({ material: '', quantity: '', notes: '', priority: 'normal' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaterialRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materialRequests', projectId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      project_id: projectId,
      requested_by: user.email,
      requested_by_name: user.full_name,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Material Requests</h2>
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">
              {requests.filter(r => r.status === 'pending').length} pending
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No material requests yet</p>
      ) : (
        <div className="space-y-2">
          {requests.map(req => {
            const Icon = statusIcons[req.status] || Clock;
            return (
              <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{req.material}</p>
                    {req.quantity && <span className="text-xs text-muted-foreground">× {req.quantity}</span>}
                    <Badge className={`text-xs ${req.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                      {req.priority}
                    </Badge>
                  </div>
                  {req.notes && <p className="text-xs text-muted-foreground mt-0.5">{req.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    By {req.requested_by_name || req.requested_by} · {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusColors[req.status]}>{req.status}</Badge>
                  {isAdmin && req.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-emerald-700 border-emerald-200"
                        onClick={() => updateMutation.mutate({ id: req.id, data: { status: 'approved' } })}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-red-700 border-red-200"
                        onClick={() => updateMutation.mutate({ id: req.id, data: { status: 'rejected' } })}>
                        Reject
                      </Button>
                    </div>
                  )}
                  {isAdmin && req.status === 'approved' && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                      onClick={() => updateMutation.mutate({ id: req.id, data: { status: 'ordered' } })}>
                      Mark Ordered
                    </Button>
                  )}
                  {isAdmin && req.status === 'ordered' && (
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2 text-emerald-700 border-emerald-200"
                      onClick={() => updateMutation.mutate({ id: req.id, data: { status: 'delivered' } })}>
                      Delivered
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Materials</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Material *</Label>
              <Input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))} placeholder="e.g. 2x4 lumber, concrete mix..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 20 pieces" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional info..." rows={2} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Submit Request</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
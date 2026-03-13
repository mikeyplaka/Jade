import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Check, CheckCheck, Send, FolderKanban, AlertCircle, Info, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const typeIcons = {
  assignment: FolderKanban,
  update: Info,
  reminder: Clock,
  general: Bell,
};

const typeColors = {
  assignment: 'text-primary',
  update: 'text-blue-500',
  reminder: 'text-amber-500',
  general: 'text-muted-foreground',
};

export default function Notifications() {
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ recipient_email: '', title: '', message: '', type: 'general' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const isManager = user?.role === 'admin' || user?.role === 'project_manager';

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await base44.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.Notification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowSend(false);
      setSendForm({ recipient_email: '', title: '', message: '', type: 'general' });
      toast.success('Notification sent');
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </Button>
          )}
          {isManager && (
            <Button size="sm" className="gap-1" onClick={() => setShowSend(true)}>
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        <Card className="divide-y">
          {notifications.map(notif => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`p-4 flex items-start gap-3 transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
              >
                <div className={`mt-0.5 ${typeColors[notif.type] || 'text-muted-foreground'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${!notif.is_read ? '' : 'text-muted-foreground'}`}>{notif.title}</p>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(notif.created_date), 'MMM d, h:mm a')}</p>
                </div>
                {!notif.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(notif.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* Send Notification Dialog */}
      <Dialog open={showSend} onOpenChange={setShowSend}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(sendForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={sendForm.recipient_email} onValueChange={v => setSendForm(p => ({ ...p, recipient_email: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.email} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={sendForm.type} onValueChange={v => setSendForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Job Assignment</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={sendForm.title} onChange={e => setSendForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={sendForm.message} onChange={e => setSendForm(p => ({ ...p, message: e.target.value }))} required rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowSend(false)}>Cancel</Button>
              <Button type="submit">Send</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
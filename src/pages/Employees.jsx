import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Users, UserPlus, Mail, Phone, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const roleColors = {
  admin: 'bg-violet-100 text-violet-700',
  project_manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-slate-100 text-slate-600',
};

export default function Employees() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const handleInvite = async () => {
    await base44.users.inviteUser(inviteEmail, inviteRole === 'admin' ? 'admin' : 'user');
    if (inviteRole !== 'admin' && inviteRole !== 'user') {
      const newUsers = await base44.entities.User.list();
      const newUser = newUsers.find(u => u.email === inviteEmail);
      if (newUser) {
        await base44.entities.User.update(newUser.id, { role: inviteRole });
      }
    }
    toast.success(`Invitation sent to ${inviteEmail}`);
    setShowInvite(false);
    setInviteEmail('');
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const getProjectCount = (email) => projects.filter(p => p.assigned_employees?.includes(email)).length;

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground">{users.length} members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No team members found</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(user => (
            <Card key={user.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.full_name || 'Unknown'}</p>
                  <Badge className={`text-xs mt-1 ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                    {user.role?.replace('_', ' ') || 'employee'}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </p>
                {user.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {user.phone}
                  </p>
                )}
                {user.specialty && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> {user.specialty}
                  </p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">{getProjectCount(user.email)} active projects</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="worker@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee / Worker</SelectItem>
                  <SelectItem value="project_manager">Project Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit">Send Invite</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
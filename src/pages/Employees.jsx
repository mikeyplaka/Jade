import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Users, UserPlus, Mail, Phone, Wrench, Shield, FolderKanban, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import ProjectForm from '@/components/projects/ProjectForm';

const roleColors = {
  admin: 'bg-violet-100 text-violet-700',
  project_manager: 'bg-blue-100 text-blue-700',
  supervisor: 'bg-indigo-100 text-indigo-700',
  foreman: 'bg-amber-100 text-amber-700',
  employee: 'bg-slate-100 text-slate-600',
  subcontractor: 'bg-orange-100 text-orange-700',
};

const roleLabels = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  supervisor: 'Supervisor',
  foreman: 'Foreman',
  employee: 'Employee',
  subcontractor: 'Subcontractor',
};

export default function Employees() {
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviteName, setInviteName] = useState('');
  
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
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole === 'admin' ? 'admin' : 'user');
      
      // Try to find the user to set their custom fields right away
      const newUsers = await base44.entities.User.list();
      const newUser = newUsers.find(u => u.email === inviteEmail);
      if (newUser) {
        await base44.entities.User.update(newUser.id, { 
          role: inviteRole,
          full_name: inviteName || undefined
        });
      }
      
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.User.update(editingUser.id, {
        full_name: editingUser.full_name,
        phone: editingUser.phone,
        specialty: editingUser.specialty,
        role: editingUser.role
      });
      toast.success('Member profile updated');
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const getProjectCount = (email) => projects.filter(p => p.assigned_employees?.includes(email)).length;
  const getEmployeeProjects = (email) => projects.filter(p => p.assigned_employees?.includes(email));

  const handleUpdateProject = async (formData) => {
    try {
      await base44.entities.Project.update(editingProject.id, formData);
      toast.success('Project updated');
      setEditingProject(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch {
      toast.error('Failed to update project');
    }
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0 border-primary/20 text-primary/80">
            Human Resources
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Team</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Managing <span className="text-foreground font-semibold">{users.length}</span> active team members and subcontractors
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 group">
          <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Invite Member
        </Button>
      </div>

      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Search by name, email or specialty..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-12 h-12 bg-card border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl shadow-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-20 text-center bg-card/50 border-dashed border-2 flex flex-col items-center justify-center rounded-3xl">
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-xl font-semibold text-muted-foreground/60">No team members found</p>
          <Button variant="link" onClick={() => setSearch('')} className="mt-2 text-primary">Clear search</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(user => (
            <Card key={user.id} className="p-6 transition-all duration-300 hover:shadow-xl border-transparent hover:border-primary/20 border-2 rounded-2xl bg-card relative group shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => { setEditingUser({ ...user }); setShowEdit(true); }}
              >
                <Wrench className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
              </Button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-base font-bold text-primary flex-shrink-0 border border-primary/10">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate group-hover:text-primary transition-colors">{user.full_name || 'Incomplete Profile'}</p>
                  <div className="mt-1">
                    <Select value={user.role || 'employee'} onValueChange={(v) => handleRoleChange(user.id, v)}>
                      <SelectTrigger className="h-6 text-[10px] border-0 p-0 gap-1 w-auto focus:ring-0 shadow-none uppercase tracking-wider font-bold">
                        <Badge className={`text-[10px] px-1.5 py-0 rounded flex items-center gap-1 shadow-none ${roleColors[user.role] || 'bg-slate-100 text-slate-600'}`}>
                          <Shield className="w-2.5 h-2.5" />
                          {roleLabels[user.role] || user.role?.replace('_', ' ') || 'Employee'}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {Object.entries(roleLabels).map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 text-xs text-muted-foreground group/item hover:bg-muted/50 transition-colors">
                  <Mail className="w-4 h-4 text-primary/60" /> 
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 text-xs text-muted-foreground group/item hover:bg-muted/50 transition-colors">
                    <Phone className="w-4 h-4 text-primary/60" /> 
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.specialty && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 text-xs text-muted-foreground group/item hover:bg-muted/50 transition-colors font-medium">
                    <Wrench className="w-4 h-4 text-primary/60" /> 
                    <span className="text-foreground/80">{user.specialty}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-muted/50">
                <button
                  className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors"
                  onClick={() => setExpandedEmployee(expandedEmployee === user.id ? null : user.id)}
                >
                  <span>Assignments</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] font-bold border-none bg-primary/5 text-primary">
                      {getProjectCount(user.email)} Projects
                    </Badge>
                    {expandedEmployee === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </button>

                {expandedEmployee === user.id && (
                  <div className="mt-3 space-y-2">
                    {getEmployeeProjects(user.email).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No projects assigned</p>
                    ) : (
                      getEmployeeProjects(user.email).map(project => (
                        <div key={project.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderKanban className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{project.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{project.address}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs flex-shrink-0 ml-2"
                            onClick={() => setEditingProject(project)}
                          >
                            <Wrench className="w-3 h-3 mr-1" /> Edit
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="rounded-2xl border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name (Optional)</Label>
              <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Doe" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="worker@email.com" className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">App Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(roleLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowInvite(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl px-6">Send Invitation</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      {editingProject && (
        <ProjectForm
          open={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
          initialData={editingProject}
          employees={users}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="rounded-2xl border-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Member Profile</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input 
                  value={editingUser.full_name || ''} 
                  onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })} 
                  className="rounded-xl h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                <Input 
                  value={editingUser.phone || ''} 
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} 
                  className="rounded-xl h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specialty / Trade</Label>
                <Input 
                  value={editingUser.specialty || ''} 
                  onChange={e => setEditingUser({ ...editingUser, specialty: e.target.value })} 
                  placeholder="e.g. Electrician, Framing" 
                  className="rounded-xl h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(roleLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowEdit(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="rounded-xl px-6">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Save, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

const roles = [
  { id: 'admin', label: 'Admin', color: 'bg-violet-100 text-violet-700', description: 'Full system access' },
  { id: 'project_manager', label: 'Project Manager', color: 'bg-blue-100 text-blue-700', description: 'Manages projects & teams' },
  { id: 'supervisor', label: 'Supervisor', color: 'bg-indigo-100 text-indigo-700', description: 'Oversees field operations' },
  { id: 'foreman', label: 'Foreman', color: 'bg-amber-100 text-amber-700', description: 'Leads crew on site' },
  { id: 'employee', label: 'Employee', color: 'bg-slate-100 text-slate-600', description: 'Field worker' },
  { id: 'subcontractor', label: 'Subcontractor', color: 'bg-orange-100 text-orange-700', description: 'External contractor' },
];

const permissionGroups = [
  {
    group: 'Projects',
    perms: [
      { key: 'can_view_projects', label: 'View Projects' },
      { key: 'can_create_projects', label: 'Create Projects' },
      { key: 'can_edit_projects', label: 'Edit Projects' },
      { key: 'can_delete_projects', label: 'Delete Projects' },
    ],
  },
  {
    group: 'Tasks',
    perms: [
      { key: 'can_view_tasks', label: 'View Tasks' },
      { key: 'can_create_tasks', label: 'Create Tasks' },
      { key: 'can_edit_tasks', label: 'Edit Tasks' },
    ],
  },
  {
    group: 'Team & Users',
    perms: [
      { key: 'can_view_team', label: 'View Team' },
      { key: 'can_invite_members', label: 'Invite Members' },
      { key: 'can_change_roles', label: 'Change Roles' },
    ],
  },
  {
    group: 'Equipment',
    perms: [
      { key: 'can_view_equipment', label: 'View Equipment' },
      { key: 'can_edit_equipment', label: 'Add / Edit Equipment' },
    ],
  },
  {
    group: 'Time & Tracking',
    perms: [
      { key: 'can_view_time_tracking', label: 'Time Tracking' },
      { key: 'can_approve_time', label: 'Approve Time Entries' },
      { key: 'can_view_field_tracking', label: 'Field Tracking (GPS)' },
    ],
  },
  {
    group: 'Reports & Admin',
    perms: [
      { key: 'can_view_dashboard', label: 'Dashboard & Reports' },
      { key: 'can_view_map', label: 'Map View' },
      { key: 'can_send_notifications', label: 'Send Notifications' },
      { key: 'can_manage_permissions', label: 'Manage Permissions' },
    ],
  },
];

const defaultPerms = {
  admin: {
    can_view_dashboard: true, can_view_projects: true, can_edit_projects: true, can_create_projects: true, can_delete_projects: true,
    can_view_tasks: true, can_edit_tasks: true, can_create_tasks: true,
    can_view_team: true, can_invite_members: true, can_change_roles: true,
    can_view_equipment: true, can_edit_equipment: true,
    can_view_time_tracking: true, can_approve_time: true, can_view_field_tracking: true, can_view_map: true,
    can_send_notifications: true, can_view_reports: true, can_manage_permissions: true,
  },
  project_manager: {
    can_view_dashboard: true, can_view_projects: true, can_edit_projects: true, can_create_projects: true, can_delete_projects: false,
    can_view_tasks: true, can_edit_tasks: true, can_create_tasks: true,
    can_view_team: true, can_invite_members: true, can_change_roles: false,
    can_view_equipment: true, can_edit_equipment: true,
    can_view_time_tracking: true, can_approve_time: true, can_view_field_tracking: true, can_view_map: true,
    can_send_notifications: true, can_view_reports: true, can_manage_permissions: false,
  },
  supervisor: {
    can_view_dashboard: true, can_view_projects: true, can_edit_projects: false, can_create_projects: false, can_delete_projects: false,
    can_view_tasks: true, can_edit_tasks: true, can_create_tasks: true,
    can_view_team: true, can_invite_members: false, can_change_roles: false,
    can_view_equipment: true, can_edit_equipment: false,
    can_view_time_tracking: true, can_approve_time: true, can_view_field_tracking: true, can_view_map: true,
    can_send_notifications: false, can_view_reports: false, can_manage_permissions: false,
  },
  foreman: {
    can_view_dashboard: false, can_view_projects: true, can_edit_projects: false, can_create_projects: false, can_delete_projects: false,
    can_view_tasks: true, can_edit_tasks: true, can_create_tasks: false,
    can_view_team: false, can_invite_members: false, can_change_roles: false,
    can_view_equipment: true, can_edit_equipment: false,
    can_view_time_tracking: true, can_approve_time: false, can_view_field_tracking: false, can_view_map: false,
    can_send_notifications: false, can_view_reports: false, can_manage_permissions: false,
  },
  employee: {
    can_view_dashboard: false, can_view_projects: false, can_edit_projects: false, can_create_projects: false, can_delete_projects: false,
    can_view_tasks: true, can_edit_tasks: false, can_create_tasks: false,
    can_view_team: false, can_invite_members: false, can_change_roles: false,
    can_view_equipment: true, can_edit_equipment: false,
    can_view_time_tracking: true, can_approve_time: false, can_view_field_tracking: false, can_view_map: false,
    can_send_notifications: false, can_view_reports: false, can_manage_permissions: false,
  },
  subcontractor: {
    can_view_dashboard: false, can_view_projects: false, can_edit_projects: false, can_create_projects: false, can_delete_projects: false,
    can_view_tasks: true, can_edit_tasks: false, can_create_tasks: false,
    can_view_team: false, can_invite_members: false, can_change_roles: false,
    can_view_equipment: false, can_edit_equipment: false,
    can_view_time_tracking: true, can_approve_time: false, can_view_field_tracking: false, can_view_map: false,
    can_send_notifications: false, can_view_reports: false, can_manage_permissions: false,
  },
};

export default function Permissions() {
  const [selectedRole, setSelectedRole] = useState('project_manager');
  const [localPerms, setLocalPerms] = useState(null);
  const queryClient = useQueryClient();

  const { data: savedPerms = [], isLoading } = useQuery({
    queryKey: ['rolePermissions'],
    queryFn: () => base44.entities.RolePermission.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ role, perms }) => {
      const existing = savedPerms.find(p => p.role === role);
      if (existing) {
        return base44.entities.RolePermission.update(existing.id, { role, ...perms });
      }
      return base44.entities.RolePermission.create({ role, ...perms });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
      setLocalPerms(null);
      toast.success('Permissions saved');
    },
  });

  const getSavedPerms = (role) => {
    const saved = savedPerms.find(p => p.role === role);
    return saved ? { ...defaultPerms[role], ...saved } : defaultPerms[role];
  };

  const currentPerms = localPerms || getSavedPerms(selectedRole);

  const toggle = (key) => {
    const base = localPerms || getSavedPerms(selectedRole);
    setLocalPerms({ ...base, [key]: !base[key] });
  };

  const handleSave = () => {
    saveMutation.mutate({ role: selectedRole, perms: currentPerms });
  };

  const handleReset = () => {
    setLocalPerms({ ...defaultPerms[selectedRole] });
  };

  const isDirty = localPerms !== null;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Permissions</h1>
          <p className="text-sm text-muted-foreground">Configure what each role can see and do</p>
        </div>
        {isDirty && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelectedRole(r.id); setLocalPerms(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              selectedRole === r.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Role Info */}
      {(() => {
        const role = roles.find(r => r.id === selectedRole);
        return (
          <Card className="p-4 flex items-center gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <span className="font-medium text-sm">{role?.label}</span>
              <span className="text-sm text-muted-foreground"> — {role?.description}</span>
            </div>
            <Badge className={`ml-auto ${role?.color}`}>{role?.label}</Badge>
          </Card>
        );
      })()}

      {/* Permissions Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {permissionGroups.map(group => (
          <Card key={group.group} className="p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">{group.group}</p>
            <div className="space-y-3">
              {group.perms.map(perm => (
                <div key={perm.key} className="flex items-center justify-between">
                  <Label htmlFor={perm.key} className="text-sm cursor-pointer text-muted-foreground">
                    {perm.label}
                  </Label>
                  <Switch
                    id={perm.key}
                    checked={!!currentPerms[perm.key]}
                    onCheckedChange={() => toggle(perm.key)}
                    disabled={selectedRole === 'admin'}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {selectedRole === 'admin' && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <Shield className="w-4 h-4 text-violet-600 shrink-0" />
          <p className="text-sm text-violet-700">Admin always has full access to all features and cannot be restricted.</p>
        </div>
      )}

      {isDirty && (
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
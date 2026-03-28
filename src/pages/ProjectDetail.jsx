import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, MapPin, CalendarDays, Users, FileText, Package,
  Plus, CheckCircle2, Circle, Clock, Edit, Trash2, PenLine
} from 'lucide-react';
import TenantSignature from '@/components/projects/TenantSignature';
import { format } from 'date-fns';
import PhotoUploader from '@/components/projects/PhotoUploader';
import ProjectForm from '@/components/projects/ProjectForm';
import MaterialRequests from '@/components/projects/MaterialRequests';
import MaterialTracker from '@/components/projects/MaterialTracker';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-slate-100 text-slate-600',
};

export default function ProjectDetail() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  const queryClient = useQueryClient();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }),
    select: (data) => data[0],
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] });
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] }),
  });

  const handleEditProject = (data) => {
    updateProjectMutation.mutate(data);
    setShowEditForm(false);
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : project.progress_percent || 0;

  const employees = users.filter(u => u.role === 'employee');
  const getEmployeeName = (email) => users.find(u => u.email === email)?.full_name || email;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/Projects">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{project.name}</h1>
            <Badge className={statusColors[project.status]}>{project.status?.replace('_', ' ')}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowEditForm(true)}>
          <Edit className="w-3.5 h-3.5" /> Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4 text-primary" /> Location</div>
          <p className="text-sm text-muted-foreground">{project.address}{project.apartment_number ? `, #${project.apartment_number}` : ''}</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="w-4 h-4 text-primary" /> Timeline</div>
          <p className="text-sm text-muted-foreground">
            {project.start_date ? format(new Date(project.start_date), 'MMM d') : 'TBD'} — {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'TBD'}
          </p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><Users className="w-4 h-4 text-primary" /> Team</div>
          <p className="text-sm text-muted-foreground">
            {project.assigned_employees?.length || 0} workers assigned
          </p>
        </Card>
      </div>

      {/* Progress */}
      <Card className="p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completedTasks} of {tasks.length} tasks completed</p>
      </Card>

      {/* Details */}
      {(project.description || project.scope_of_work || project.materials_needed) && (
        <Card className="p-5 space-y-4">
          {project.description && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1"><FileText className="w-4 h-4" /> Description</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
          {project.scope_of_work && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1">Scope of Work</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.scope_of_work}</p>
            </div>
          )}
          {project.materials_needed && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1"><Package className="w-4 h-4" /> Materials</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.materials_needed}</p>
            </div>
          )}
        </Card>
      )}

      {/* Tasks */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Tasks</h2>
          <Button size="sm" className="gap-1" onClick={() => setShowTaskForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Task
          </Button>
        </div>
        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
          {tasks.map(task => (
            <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
              <button
                onClick={() => updateTaskMutation.mutate({
                  id: task.id,
                  data: { status: task.status === 'completed' ? 'pending' : 'completed' }
                })}
                className="mt-0.5"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="w-5 h-5 text-blue-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.assigned_to && (
                  <p className="text-xs text-muted-foreground mt-0.5">{getEmployeeName(task.assigned_to)}</p>
                )}
              </div>
              {task.due_date && (
                <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), 'MMM d')}</span>
              )}
              <button onClick={() => deleteTaskMutation.mutate(task.id)} className="opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Material Tracker */}
      <Card className="p-5">
        <MaterialTracker
          projectId={projectId}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'project_manager'}
        />
      </Card>

      {/* Material Requests */}
      <Card className="p-5">
        <MaterialRequests
          projectId={projectId}
          user={currentUser}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'project_manager'}
        />
      </Card>

      {/* Photos */}
      <Card className="p-5">
        <PhotoUploader
          label="Project Photos"
          photos={project.photos || []}
          onPhotosChange={(photos) => updateProjectMutation.mutate({ photos })}
        />
      </Card>

      {/* Tenant Signature */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Tenant Sign-Off</h2>
        </div>
        <TenantSignature
          existingSignature={project.tenant_signature}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'project_manager'}
          onSave={(sig) => updateProjectMutation.mutate({ tenant_signature: sig })}
        />
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createTaskMutation.mutate(taskForm); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={taskForm.assigned_to} onValueChange={v => setTaskForm(p => ({ ...p, assigned_to: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.email} value={e.email}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowTaskForm(false)}>Cancel</Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project */}
      <ProjectForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditProject}
        initialData={project}
        employees={users}
      />
    </div>
  );
}
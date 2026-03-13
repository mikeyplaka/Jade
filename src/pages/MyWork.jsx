import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MapPin, CalendarDays, Package, CheckCircle2, Circle, Clock,
  Camera, MessageSquare, HardHat
} from 'lucide-react';
import { format } from 'date-fns';
import PhotoUploader from '@/components/projects/PhotoUploader';
import PullToRefresh from '@/components/PullToRefresh';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function MyWork() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState(null);
  const [noteText, setNoteText] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['myProjects', user?.email],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
    enabled: !!user?.email,
    select: (data) => data.filter(p => p.assigned_employees?.includes(user.email) && p.status !== 'completed'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['myTasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user.email }),
    enabled: !!user?.email,
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      setSelectedTask(null);
    },
  });

  const getProject = (id) => allProjects.find(p => p.id === id);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['myProjects'] }),
      queryClient.invalidateQueries({ queryKey: ['myTasks'] }),
    ]);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Work</h1>
        <p className="text-sm text-muted-foreground">{pendingTasks.length} active tasks, {projects.length} projects</p>
      </div>

      {/* Active Jobs */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Projects</h2>
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <HardHat className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active projects assigned</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <Card key={project.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{project.name}</h3>
                  <Badge className={statusColors[project.status]}>{project.status?.replace('_', ' ')}</Badge>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {project.address}
                  </p>
                  {project.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </p>
                  )}
                  {project.materials_needed && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> {project.materials_needed}
                    </p>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">{project.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">My Tasks</h2>
        {pendingTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {pendingTasks.map(task => {
              const project = getProject(task.project_id);
              return (
                <div key={task.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => updateTaskMutation.mutate({ id: task.id, data: { status: 'completed' } })} className="mt-0.5">
                      {task.status === 'in_progress' ? (
                        <Clock className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      {project && <p className="text-xs text-primary mt-0.5">{project.name}</p>}
                      {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {format(new Date(task.due_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Add notes & photos" onClick={() => { setSelectedTask(task); setNoteText(task.notes || ''); }}>
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Add notes" onClick={() => { setSelectedTask(task); setNoteText(task.notes || ''); }}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed ({completedTasks.length})</h2>
          <Card className="divide-y">
            {completedTasks.slice(0, 10).map(task => {
              const project = getProject(task.project_id);
              const afterPhotos = task.photos_after || [];
              return (
                <div key={task.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through text-muted-foreground">{task.title}</p>
                      {project && <p className="text-xs text-primary mt-0.5">{project.name}</p>}
                      {afterPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {afterPhotos.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-16 h-16 rounded object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => { setSelectedTask(task); setNoteText(task.notes || ''); }}
                    >
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask?.status === 'completed'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <Circle className="w-4 h-4 text-muted-foreground" />}
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Notes</p>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Describe any notes or issues..." />
            </div>
            {selectedTask && (
              <>
                <PhotoUploader
                  label="Before Photos"
                  photos={selectedTask.photos_before || []}
                  onPhotosChange={(photos) =>
                    updateTaskMutation.mutate({ id: selectedTask.id, data: { photos_before: photos } })
                  }
                />
                <PhotoUploader
                  label="After Photos (Completed Work)"
                  photos={selectedTask.photos_after || []}
                  onPhotosChange={(photos) =>
                    updateTaskMutation.mutate({ id: selectedTask.id, data: { photos_after: photos } })
                  }
                />
              </>
            )}
            <div className="flex justify-between gap-3 pt-1">
              {selectedTask?.status !== 'completed' && (
                <Button
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => updateTaskMutation.mutate({ id: selectedTask.id, data: { status: 'completed', notes: noteText } })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Complete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
                <Button onClick={() => updateTaskMutation.mutate({ id: selectedTask.id, data: { notes: noteText } })}>
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
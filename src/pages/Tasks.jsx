import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CheckCircle2, Circle, Clock, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const statusIcons = {
  pending: <Circle className="w-5 h-5 text-muted-foreground" />,
  in_progress: <Clock className="w-5 h-5 text-blue-500" />,
  completed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown Project';
  const getEmployeeName = (email) => users.find(u => u.email === email)?.full_name || email || 'Unassigned';

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Tasks</h1>
        <p className="text-sm text-muted-foreground">{tasks.length} total tasks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <ListChecks className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No tasks found</p>
        </Card>
      ) : (
        <Card className="divide-y">
          {filtered.map(task => (
            <div key={task.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
              <button
                onClick={() => updateMutation.mutate({
                  id: task.id,
                  data: { status: task.status === 'completed' ? 'pending' : 'completed' }
                })}
                className="mt-0.5"
              >
                {statusIcons[task.status]}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Link to={`/ProjectDetail?id=${task.project_id}`} className="text-xs text-primary hover:underline">
                    {getProjectName(task.project_id)}
                  </Link>
                  <span className="text-xs text-muted-foreground">{getEmployeeName(task.assigned_to)}</span>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), 'MMM d')}</span>
                  )}
                </div>
              </div>
              <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
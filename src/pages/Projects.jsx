import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MapPin, CalendarDays, Users, FolderKanban, Filter } from 'lucide-react';
import { format } from 'date-fns';
import ProjectForm from '@/components/projects/ProjectForm';
import { cn } from '@/lib/utils';

const statusColors = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
  on_hold: 'bg-slate-500/10 text-slate-600 border-slate-200/50',
};

const priorityColors = {
  low: 'bg-slate-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
};

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const employeeRoles = ['employee', 'foreman', 'subcontractor'];
  const isEmployee = employeeRoles.includes(currentUser?.role);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', currentUser?.email],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
    enabled: !!currentUser,
    select: (data) => isEmployee
      ? data.filter(p => p.assigned_employees?.includes(currentUser.email))
      : data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !isEmployee,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') setShowForm(true);
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || p.address?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0 border-primary/20 text-primary/80">
            Operations
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            Managing <span className="text-foreground font-semibold">{projects.length}</span> active site locations
          </p>
        </div>
        {!isEmployee && (
          <Button onClick={() => setShowForm(true)} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 group">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            New Project
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/10 p-2 rounded-2xl">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name or address..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-12 h-12 bg-card border-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary/50 transition-all rounded-xl shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/20 rounded-lg whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            Status
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-12 bg-card border-none ring-1 ring-border rounded-xl shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-20 text-center bg-card/50 border-dashed border-2 flex flex-col items-center justify-center rounded-3xl">
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
            <FolderKanban className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <p className="text-xl font-semibold text-muted-foreground/60">No matching projects found</p>
          <Button variant="link" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="mt-2 text-primary">Clear all filters</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(project => (
            <Link key={project.id} to={`/ProjectDetail?id=${project.id}`} className="block group">
              <Card className="p-6 h-full transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border-transparent hover:border-primary/20 border-2 rounded-2xl relative overflow-hidden bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0 animate-pulse",
                      priorityColors[project.priority] || 'bg-slate-300'
                    )} />
                    <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{project.name}</h3>
                  </div>
                  <Badge variant="default" className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-none whitespace-nowrap",
                    statusColors[project.status] || 'bg-slate-500/10 text-slate-600'
                  )}>
                    {project.status?.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs text-muted-foreground flex items-center gap-2 leading-relaxed">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary/60" />
                    <span className="truncate">{project.address}{project.apartment_number ? `, #${project.apartment_number}` : ''}</span>
                  </p>
                  {project.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 flex-shrink-0 text-primary/60" />
                      Due {format(new Date(project.deadline), 'MMMM d, yyyy')}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.assigned_employees?.slice(0, 3).map((emp, i) => (
                        <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                          {emp[0]}
                        </div>
                      ))}
                      {project.assigned_employees?.length > 3 && (
                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-muted flex items-center justify-center text-[8px] font-bold">
                          +{project.assigned_employees.length - 3}
                        </div>
                      )}
                    </div>
                    {project.assigned_employees?.length > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                        {project.assigned_employees.length} Members
                      </span>
                    )}
                  </div>
                </div>

                {(project.progress_percent > 0 || project.status === 'completed') && (
                  <div className="mt-auto pt-4 border-t border-muted/30">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      <span>Progress</span>
                      <span className="text-foreground">{project.status === 'completed' ? 100 : (project.progress_percent || 0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${project.status === 'completed' ? 100 : (project.progress_percent || 0)}%` }} 
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isEmployee && (
        <ProjectForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          initialData={null}
          employees={users}
        />
      )}
    </div>
  );
}
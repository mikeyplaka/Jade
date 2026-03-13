import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, CheckCircle2, Users, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { isAfter, parseISO } from 'date-fns';
import StatsCard from '@/components/dashboard/StatsCard';
import ProjectList from '@/components/dashboard/ProjectList';

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const employees = users.filter(u => u.role === 'employee');
  const today = new Date();
  const behindSchedule = projects.filter(p =>
    p.status !== 'completed' && p.deadline && isAfter(today, parseISO(p.deadline))
  );

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of all operations</p>
        </div>
        <Link to="/Projects?new=true">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Projects" value={activeProjects.length} subtitle={`${projects.length} total`} icon={FolderKanban} color="bg-blue-100 text-blue-600" />
        <StatsCard title="Completed" value={completedProjects.length} subtitle={`${completedTasks.length} tasks done`} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
        <StatsCard title="Team Members" value={employees.length} subtitle={`${users.length} total users`} icon={Users} color="bg-violet-100 text-violet-600" />
        <StatsCard title="Behind Schedule" value={behindSchedule.length} subtitle={`${pendingTasks.length} pending tasks`} icon={AlertTriangle} color="bg-red-100 text-red-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ProjectList projects={activeProjects} title="Active Projects" />
        <ProjectList projects={behindSchedule} title="Behind Schedule" />
      </div>
    </div>
  );
}
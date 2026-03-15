import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, FolderKanban, ListChecks, Users, Calendar,
  Map, Bell, Clock, Menu, LogOut, ChevronRight, HardHat, Trash2, Navigation, MessageSquare,
  Wrench, Shield } from
'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from
'@/components/ui/alert-dialog';
import MobileTabBar from '@/components/MobileTabBar';

const navItems = [
{ path: '/Dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'project_manager', 'supervisor'] },
{ path: '/MyWork', label: 'My Work', icon: HardHat, roles: ['employee', 'foreman', 'subcontractor'] },
{ path: '/Projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'supervisor', 'foreman'] },
{ path: '/Tasks', label: 'Tasks', icon: ListChecks, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'] },
{ path: '/Employees', label: 'Team', icon: Users, roles: ['admin', 'project_manager', 'supervisor'] },
{ path: '/EmployeeTracking', label: 'Field Tracking', icon: Navigation, roles: ['admin', 'project_manager', 'supervisor'] },
{ path: '/Schedule', label: 'Schedule', icon: Calendar, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'] },
{ path: '/MapView', label: 'Map', icon: Map, roles: ['admin', 'project_manager', 'supervisor'] },
{ path: '/TimeTracking', label: 'Time Clock', icon: Clock, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'] },
{ path: '/Notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'] },
{ path: '/GroupChat', label: 'Group Chat', icon: MessageSquare, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee', 'subcontractor'] },
{ path: '/Equipment', label: 'Equipment', icon: Wrench, roles: ['admin', 'project_manager', 'supervisor', 'foreman', 'employee'] },
{ path: '/Permissions', label: 'Permissions', icon: Shield, roles: ['admin'] }];


export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: unreadNotifs = [] } = useQuery({
    queryKey: ['unreadNotifs', user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }),
    enabled: !!user?.email
  });

  const role = user?.role || 'employee';
  const filteredNav = navItems.filter((item) => item.roles.includes(role));
  const unreadCount = unreadNotifs.length;

  const NavContent = () =>
  <div className="flex flex-col h-full">
      <div className="px-5 py-6 flex items-center gap-3" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">BuildTrack</h1>
          <p className="text-xs text-sidebar-foreground/50">Construction Manager</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {filteredNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all select-none ${
              isActive ?
              'bg-sidebar-accent text-primary' :
              'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`
              }>

                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.path === '/Notifications' && unreadCount > 0 &&
              <Badge className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0">
                    {unreadCount}
                  </Badge>
              }
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>);

        })}
        </nav>
      </ScrollArea>

      <div
      className="p-4 border-t border-sidebar-border space-y-3"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-foreground">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/50 capitalize">{role.replace('_', ' ')}</p>
          </div>
          <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => base44.auth.logout()}>

            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors select-none">
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Your account and all associated data will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => base44.auth.logout()}>

                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>;


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>

          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border">
                <NavContent />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                
              </div>
              <span className="font-bold text-sm">BuildTrack</span>
            </div>
          </div>
          <Link to="/Notifications" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 &&
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            }
          </Link>
        </header>

        <main className="flex-1 overflow-auto pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>

        <MobileTabBar unreadCount={unreadCount} />
      </div>
    </div>);

}
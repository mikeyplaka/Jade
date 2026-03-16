import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOfflineSync, createTimeEntryOffline, updateTimeEntryOffline } from '@/components/useOfflineSync';
import OfflineBanner from '@/components/OfflineBanner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, MapPin } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

export default function TimeTracking() {
  const [selectedProject, setSelectedProject] = useState('');
  const [clockNotes, setClockNotes] = useState('');
  const queryClient = useQueryClient();
  // Local state for offline active entry
  const [localActiveEntry, setLocalActiveEntry] = useState(null);

  const onSyncComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    setLocalActiveEntry(null);
  }, [queryClient]);

  const { isOnline, pendingCount, isSyncing, sync } = useOfflineSync(onSyncComplete);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['timeEntries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ employee_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const activeEntry = entries.find(e => !e.clock_out) || localActiveEntry;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown';

  const handleClockIn = async () => {
    if (!selectedProject) return;
    const data = {
      employee_email: user.email,
      project_id: selectedProject,
      clock_in: new Date().toISOString(),
      notes: clockNotes,
    };
    const result = await createTimeEntryOffline(data, isOnline);
    if (result.offline) {
      setLocalActiveEntry({ ...data, id: result._tempId, _offline: true });
    } else {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
    }
    setClockNotes('');
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;
    const clockOutData = { clock_out: new Date().toISOString() };
    if (activeEntry._offline) {
      // Update the queued op — just update local state, it'll sync when online
      setLocalActiveEntry(prev => ({ ...prev, ...clockOutData }));
      await updateTimeEntryOffline(activeEntry.id, clockOutData, false);
    } else {
      await updateTimeEntryOffline(activeEntry.id, clockOutData, isOnline);
      if (isOnline) {
        queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      }
      setLocalActiveEntry(null);
    }
  };

  const formatDuration = (entry) => {
    const end = entry.clock_out ? new Date(entry.clock_out) : new Date();
    const mins = differenceInMinutes(end, new Date(entry.clock_in));
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Time Clock</h1>
        <p className="text-sm text-muted-foreground">Track your work hours</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="p-6">
        {activeEntry ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">Currently Clocked In</p>
              <p className="text-2xl font-bold mt-1">{formatDuration(activeEntry)}</p>
              <p className="text-sm text-muted-foreground mt-1">{getProjectName(activeEntry.project_id)}</p>
              <p className="text-xs text-muted-foreground">Since {format(new Date(activeEntry.clock_in), 'h:mm a')}</p>
            </div>
            <Button onClick={handleClockOut} variant="destructive" size="lg" className="gap-2 w-full sm:w-auto">
              <Square className="w-4 h-4" /> Clock Out
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Not clocked in</p>
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Select job site" /></SelectTrigger>
              <SelectContent>
                {projects.filter(p => p.status !== 'completed').map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea value={clockNotes} onChange={e => setClockNotes(e.target.value)} placeholder="Work notes (optional)..." rows={2} />
            <Button onClick={handleClockIn} disabled={!selectedProject} size="lg" className="gap-2 w-full">
              <Play className="w-4 h-4" /> Clock In
            </Button>
          </div>
        )}
      </Card>

      {/* Recent Entries */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Time Entries</h2>
        {entries.filter(e => e.clock_out).length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No completed time entries yet</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {entries.filter(e => e.clock_out).map(entry => (
              <div key={entry.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getProjectName(entry.project_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(entry.clock_in), 'MMM d • h:mm a')} – {format(new Date(entry.clock_out), 'h:mm a')}
                  </p>
                  {entry.notes && <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>}
                </div>
                <Badge variant="secondary" className="text-xs font-mono">{formatDuration(entry)}</Badge>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
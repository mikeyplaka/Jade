import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, CheckCircle2, Navigation } from 'lucide-react';

export default function LocationCheckIn({ user, projects = [] }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('idle'); // idle | locating | success | error
  const [selectedProject, setSelectedProject] = useState('');
  const [activity, setActivity] = useState('check_in');
  const [errorMsg, setErrorMsg] = useState('');

  const logMutation = useMutation({
    mutationFn: (data) => base44.entities.LocationLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locationLogs'] });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const handleCheckIn = () => {
    setStatus('locating');
    setErrorMsg('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setStatus('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        logMutation.mutate({
          employee_email: user.email,
          employee_name: user.full_name,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          project_id: selectedProject || undefined,
          activity,
        });
      },
      (err) => {
        setErrorMsg('Could not get location. Please allow location access.');
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Location Check-In</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger className="h-9 text-sm flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="check_in">Check In</SelectItem>
            <SelectItem value="on_site">On Site</SelectItem>
            <SelectItem value="traveling">Traveling</SelectItem>
            <SelectItem value="check_out">Check Out</SelectItem>
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="h-9 text-sm flex-1">
              <SelectValue placeholder="Link to project (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>No project</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          onClick={handleCheckIn}
          disabled={status === 'locating' || logMutation.isPending}
          className="h-9 shrink-0"
          size="sm"
        >
          {status === 'locating' || logMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Locating...</>
          ) : status === 'success' ? (
            <><CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" /> Logged!</>
          ) : (
            <><MapPin className="w-4 h-4 mr-1.5" /> Share Location</>
          )}
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-destructive mt-2">{errorMsg}</p>}
    </Card>
  );
}
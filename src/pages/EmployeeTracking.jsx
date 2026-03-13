import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock, User, Navigation, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const activityColors = {
  check_in: 'bg-emerald-100 text-emerald-700',
  check_out: 'bg-slate-100 text-slate-700',
  on_site: 'bg-blue-100 text-blue-700',
  traveling: 'bg-amber-100 text-amber-700',
};

const activityLabel = {
  check_in: 'Checked In',
  check_out: 'Checked Out',
  on_site: 'On Site',
  traveling: 'Traveling',
};

export default function EmployeeTracking() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['locationLogs'],
    queryFn: () => base44.entities.LocationLog.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  // Get the most recent log per employee
  const latestByEmployee = Object.values(
    logs.reduce((acc, log) => {
      if (!acc[log.employee_email] || new Date(log.created_date) > new Date(acc[log.employee_email].created_date)) {
        acc[log.employee_email] = log;
      }
      return acc;
    }, {})
  );

  const getProject = (id) => projects.find(p => p.id === id);

  const mapCenter = latestByEmployee.length > 0
    ? [latestByEmployee[0].latitude, latestByEmployee[0].longitude]
    : [40.7128, -74.0060];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Tracking</h1>
          <p className="text-sm text-muted-foreground">{latestByEmployee.length} employees with location data</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['locationLogs'] })}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Map */}
      {latestByEmployee.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="h-72 lg:h-96">
            <MapContainer center={mapCenter} zoom={11} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {latestByEmployee.map((log) => (
                <Marker key={log.id} position={[log.latitude, log.longitude]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{log.employee_name || log.employee_email}</p>
                      <p className="text-muted-foreground">{activityLabel[log.activity] || log.activity}</p>
                      {log.project_id && getProject(log.project_id) && (
                        <p className="text-blue-600">{getProject(log.project_id).name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Navigation className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No location data yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Employees can share their location from the My Work page.</p>
        </Card>
      )}

      {/* Employee Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {latestByEmployee.map((log) => {
          const project = log.project_id ? getProject(log.project_id) : null;
          return (
            <Card key={log.employee_email} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{log.employee_name || log.employee_email}</p>
                    <Badge className={activityColors[log.activity] || 'bg-muted text-muted-foreground'}>
                      {activityLabel[log.activity] || log.activity}
                    </Badge>
                  </div>
                  {project && (
                    <p className="text-xs text-primary flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {project.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                  </p>
                  {log.accuracy && (
                    <p className="text-xs text-muted-foreground mt-0.5">±{log.accuracy}m accuracy</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Log */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
          <Card className="divide-y">
            {logs.slice(0, 20).map((log) => {
              const project = log.project_id ? getProject(log.project_id) : null;
              return (
                <div key={log.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{log.employee_name || log.employee_email}</span>
                      {' '}
                      <span className="text-muted-foreground">{activityLabel[log.activity] || log.activity}</span>
                      {project && <span className="text-primary"> · {project.name}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge className={activityColors[log.activity] || 'bg-muted text-muted-foreground'} >
                    {activityLabel[log.activity]}
                  </Badge>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
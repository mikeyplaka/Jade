import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  on_hold: 'bg-slate-100 text-slate-600',
};

export default function MapView() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const projectsWithCoords = projects.filter(p => p.latitude && p.longitude);
  const defaultCenter = projectsWithCoords.length > 0
    ? [projectsWithCoords[0].latitude, projectsWithCoords[0].longitude]
    : [40.7128, -74.0060];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Map</h1>
        <p className="text-sm text-muted-foreground">{projectsWithCoords.length} projects with locations</p>
      </div>

      {projectsWithCoords.length === 0 ? (
        <div className="bg-card rounded-xl border p-12 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No projects with coordinates yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add latitude/longitude to projects to see them on the map</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ height: 'calc(100vh - 200px)' }}>
          <MapContainer center={defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {projectsWithCoords.map(project => (
              <Marker key={project.id} position={[project.latitude, project.longitude]}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-sm">{project.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{project.address}</p>
                    <div className="mt-2">
                      <Badge className={`text-xs ${statusColors[project.status]}`}>{project.status?.replace('_', ' ')}</Badge>
                    </div>
                    <Link to={`/ProjectDetail?id=${project.id}`} className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> View Project
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
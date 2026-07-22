import React, { useEffect, useRef, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import Supercluster from 'supercluster';


import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { humanizeIssueType } from '@/utils/issueHelpers';
import { Navigation } from 'lucide-react';

interface IssueMapProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string) => void;
  className?: string;
}

const getIssueTypeColor = (type: string): string => {
  switch (type) {
    case 'road_damage': return '#EF4444';      // Red
    case 'street_lighting': return '#F59E0B';  // Gold
    case 'garbage': return '#F97316';          // Orange
    case 'water': return '#3B82F6';            // Blue
    case 'footpath': return '#10B981';         // Green
    case 'dumping': return '#8B5CF6';          // Purple
    default: return '#64748B';                 // Slate
  }
};

export const IssueMap: React.FC<IssueMapProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  className,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Group reports by cluster_id or issue.id (if solitary)
  const groupedData = useMemo(() => {
    const groups: Record<string, Issue[]> = {};
    issues.forEach((issue) => {
      const key = issue.cluster_id || `solitary-${issue.id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    });

    return Object.entries(groups).map(([key, reports]) => {
      const sorted = [...reports].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const primary = sorted[0];
      return {
        key,
        reports: sorted,
        primary,
        latitude: primary.latitude,
        longitude: primary.longitude,
        maxSeverity: Math.max(...reports.map((r) => r.severity)),
      };
    });
  }, [issues]);

  // Convert grouped data to GeoJSON features for Supercluster
  const geojsonFeatures = useMemo(() => {
    return groupedData.map((group) => ({
      type: 'Feature' as const,
      properties: {
        clusterKey: group.key,
        primaryId: group.primary.id,
        issueType: group.primary.issue_type,
        reportCount: group.reports.length,
        maxSeverity: group.maxSeverity,
        primaryPhoto: group.primary.photo_url,
        primaryStatus: group.primary.status,
        description: group.primary.description,
        groupRef: group,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [group.longitude, group.latitude] as [number, number],
      },
    }));
  }, [groupedData]);

  // Supercluster instance
  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 50,
      maxZoom: 16,
    });
    sc.load(geojsonFeatures as any);
    return sc;
  }, [geojsonFeatures]);

  // Initialize MapLibre GL Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use OpenFreeMap Liberty Vector Style (completely free, zero API key)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [72.8777, 19.0760], // Mumbai Center [lng, lat]
      zoom: 12,
      maxZoom: 18,
      minZoom: 9,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '240px',
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render & Update Supercluster Markers when map moves or data changes
  const updateMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const clusters = supercluster.getClusters(bbox, zoom);

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isCluster = cluster.properties && (cluster.properties as any).cluster;

      const el = document.createElement('div');
      el.className = 'custom-maplibre-marker';
      el.style.cursor = 'pointer';

      if (isCluster) {
        // Multi-point cluster marker
        const pointCount = (cluster.properties as any).point_count;
        const size = Math.min(30 + pointCount * 3, 56);

        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#0F766E';
        el.style.border = '2.5px solid #FFFFFF';
        el.style.color = '#FFFFFF';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = '700';
        el.style.fontSize = '12px';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        el.innerText = pointCount.toString();

        el.addEventListener('click', () => {
          const expansionZoom = Math.min(
            supercluster.getClusterExpansionZoom(cluster.id as number),
            17
          );
          map.easeTo({
            center: [lng, lat],
            zoom: expansionZoom,
            duration: 500,
          });
        });
      } else {
        // Individual issue marker
        const props = cluster.properties as any;
        const typeColor = getIssueTypeColor(props.issueType);
        const reportCount = props.reportCount;

        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = typeColor;
        el.style.border = '2.5px solid #FFFFFF';
        el.style.color = '#FFFFFF';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = '800';
        el.style.fontSize = '11px';
        el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
        el.innerText = reportCount > 1 ? reportCount.toString() : '•';

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectIssue(props.primaryId);

          const group = props.groupRef;
          const primary = group.primary;
          const reports = group.reports;
          const avgSeverity = (reports.reduce((sum: number, r: Issue) => sum + r.severity, 0) / reports.length).toFixed(1);

          const popupContent = `
            <div style="font-family: system-ui, sans-serif; padding: 2px; font-size: 11px; color: #334155;">
              <div style="height: 95px; width: 100%; border-radius: 6px; overflow: hidden; background-color: #f1f5f9; margin-bottom: 6px;">
                <img src="${getImageUrl(primary.photo_url)}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
                ${humanizeIssueType(primary.issue_type, primary.description)}
              </div>
              <div style="color: #64748b; font-size: 10px; font-weight: 500; margin-bottom: 6px;">
                📍 ${getLocalityName(primary.latitude, primary.longitude)}
              </div>
              <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                <span style="font-size: 8.5px; font-weight: 800; padding: 2px 5px; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0; text-transform: uppercase;">
                  Severity ${avgSeverity}/5
                </span>
                <span style="font-size: 8.5px; font-weight: 800; padding: 2px 5px; border-radius: 4px; color: #0d9488; background: #f0fdfa; border: 1px solid #ccfbf1; text-transform: uppercase;">
                  ${primary.status}
                </span>
              </div>
            </div>
          `;

          if (popupRef.current) {
            popupRef.current
              .setLngLat([lng, lat])
              .setHTML(popupContent)
              .addTo(map);
          }
        });
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  // Sync markers on map move or zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    updateMarkers();

    const handleMove = () => updateMarkers();
    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);

    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, [supercluster, mapRef.current]);

  // Center & Fit Bounds when groupedData changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || groupedData.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    groupedData.forEach((g) => {
      bounds.extend([g.longitude, g.latitude]);
    });

    if (groupedData.length === 1) {
      map.flyTo({ center: [groupedData[0].longitude, groupedData[0].latitude], zoom: 14 });
    } else {
      map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
    }
  }, [groupedData]);

  // Fly to selected issue on list interaction
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;

    const targetGroup = groupedData.find((g) => g.reports.some((r) => r.id === selectedIssueId));
    if (targetGroup) {
      map.flyTo({
        center: [targetGroup.longitude, targetGroup.latitude],
        zoom: 15,
        duration: 800,
      });
    }
  }, [selectedIssueId, groupedData]);

  // Geolocate user position
  const handleGeolocate = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
          duration: 1000,
        });
      },
      (err) => console.error('Geolocation error:', err)
    );
  };

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-medium shadow-md text-[10px] space-y-2 select-none z-10 max-w-[150px] font-sans font-medium text-slate-700">
        <div className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1 text-[9px]">
          Vector Map Legend
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-red-500" />
            <span>Road Damage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-amber-500" />
            <span>Street Light</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-orange-500" />
            <span>Garbage Overflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-blue-500" />
            <span>Water Leak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 bg-emerald-500" />
            <span>Footpath Slabs</span>
          </div>
        </div>
      </div>

      {/* Locate button */}
      <button
        onClick={handleGeolocate}
        className="absolute bottom-6 right-4 bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-medium shadow-md text-slate-700 transition-all select-none z-10 cursor-pointer active:scale-95"
        title="Pan to My Current Location"
      >
        <Navigation size={15} className="rotate-45" />
      </button>

      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
};

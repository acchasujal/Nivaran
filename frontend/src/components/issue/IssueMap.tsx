import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Supercluster from 'supercluster';

import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { humanizeIssueType } from '@/utils/issueHelpers';
import { Navigation, AlertTriangle } from 'lucide-react';

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
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  // Sanitize and filter input issues
  const validIssues = useMemo(() => {
    return issues.filter((issue) => {
      const lat = Number(issue.latitude);
      const lng = Number(issue.longitude);
      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });
  }, [issues]);

  // Group reports by cluster_id or issue.id (if solitary)
  const groupedData = useMemo(() => {
    const groups: Record<string, Issue[]> = {};
    validIssues.forEach((issue) => {
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
  }, [validIssues]);

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
    console.log('[MapLibre Debug] Component mounted');

    if (typeof (maplibregl as any).supported === 'function' && !(maplibregl as any).supported()) {
      console.warn('[MapLibre Debug] WebGL is not supported in this browser environment');
      setWebGlSupported(false);
      return;
    }

    const container = mapContainerRef.current;
    if (!container) return;
    if (mapRef.current) return;

    const rect = container.getBoundingClientRect();
    console.log('[MapLibre Debug] Host element:', container);
    console.log('[MapLibre Debug] Host size:', { width: rect.width, height: rect.height, rect });
    console.log('[MapLibre Debug] Supported WebGL:', (maplibregl as any).supported());
    console.log('[MapLibre Debug] Constructing MapLibre map instance...');

    try {
      const map = new maplibregl.Map({
        container: container,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        },
        center: [72.8777, 19.0760], // Mumbai Center [lng, lat]
        zoom: 12,
        maxZoom: 18,
        minZoom: 2,
        attributionControl: false,
      });

      console.log('[MapLibre Debug] Map constructed successfully:', map);

      map.on('load', () => {
        console.log('[MapLibre Debug] Event: load');
        map.resize();
        const canvas = container.querySelector('.maplibregl-canvas') as HTMLCanvasElement | null;
        const controls = container.querySelector('.maplibregl-control-container');
        console.log('[MapLibre Debug] DOM Check - Canvas exists:', !!canvas, 'Dimensions:', canvas?.width, 'x', canvas?.height);
        console.log('[MapLibre Debug] DOM Check - Controls exist:', !!controls);
      });

      map.on('style.load', () => console.log('[MapLibre Debug] Event: style.load'));
      map.on('idle', () => console.log('[MapLibre Debug] Event: idle'));
      map.on('error', (e) => console.error('[MapLibre Debug] Event: error', e));
      map.on('webglcontextlost', (e) => console.error('[MapLibre Debug] Event: webglcontextlost', e));

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '240px',
      });

      mapRef.current = map;

      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(container);

      return () => {
        console.log('[MapLibre Debug] Cleanup triggered, removing map instance');
        resizeObserver.disconnect();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error('[MapLibre Debug] Map constructor exception:', err);
    }
  }, []);

  // Render & Update Supercluster Markers when map moves or data changes
  const updateMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

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

  if (!webGlSupported) {
    return (
      <div className={className} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-6 text-center text-slate-700 font-sans space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <h4 className="font-bold text-base text-slate-800">WebGL Vector Map Fallback</h4>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Vector graphics (WebGL) are not supported by your browser session. Please review the reports list directly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '360px' }}>
      {/* Dedicated MapLibre Canvas Container Host Element */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Legend Overlay */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-medium shadow-md text-[10px] space-y-2 select-none z-10 max-w-[150px] font-sans font-medium text-slate-700 pointer-events-auto">
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
        className="absolute bottom-6 right-4 bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-medium shadow-md text-slate-700 transition-all select-none z-10 cursor-pointer active:scale-95 pointer-events-auto"
        title="Pan to My Current Location"
      >
        <Navigation size={15} className="rotate-45" />
      </button>
    </div>
  );
};

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Issue } from '@/api/types';
import { getImageUrl } from '@/utils/getImageUrl';
import { getLocalityName } from '@/utils/getLocalityName';
import { humanizeIssueType } from '@/utils/issueHelpers';
import { Loader2, AlertTriangle, Navigation } from 'lucide-react';
import { loadGoogleMaps } from '@/utils/loadGoogleMaps';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Group reports by cluster_id or issue.id (if solitary) using existing Agent 2 data
  const groupedData = useMemo(() => {
    const groups: Record<string, Issue[]> = {};
    issues.forEach((issue) => {
      const key = issue.cluster_id || `solitary-${issue.id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(issue);
    });

    return Object.entries(groups).map(([key, reports]) => {
      // Sort reports by created_at desc so latest is primary
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

  // Load Google Maps Script dynamically using bulletproof loading utility
  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(() => {
        if (active) setMapsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps script:', err);
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInstance) return;

    try {
      const g = (window as any).google;
      const defaultCenter = { lat: 19.0760, lng: 72.8777 }; // Mumbai Center
      const instance = new g.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        maxZoom: 18,
        minZoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: g.maps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: false,
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'poi',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      infoWindowRef.current = new g.maps.InfoWindow();
      setMapInstance(instance);
    } catch (err) {
      console.error('Failed to instantiate Google Map:', err);
      setLoadError(true);
    }
  }, [mapsLoaded, mapInstance]);

  // Update Markers & Auto-Fit Bounds
  useEffect(() => {
    if (!mapInstance || !infoWindowRef.current) return;

    const g = (window as any).google;
    let boundsListener: any = null;

    // Clear existing markers and their listeners
    markersRef.current.forEach((marker) => {
      g.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
    markersRef.current = [];

    if (groupedData.length === 0) {
      mapInstance.setCenter({ lat: 19.0760, lng: 72.8777 });
      mapInstance.setZoom(12);
      return;
    }

    const bounds = new g.maps.LatLngBounds();

    groupedData.forEach(({ reports, primary, latitude, longitude, maxSeverity }) => {
      const position = { lat: latitude, lng: longitude };
      bounds.extend(position);

      // Custom Color Coding by Issue Type & Risk-based outer halo radius/opacity
      const typeColor = getIssueTypeColor(primary.issue_type);
      const ringRadius = 10 + (maxSeverity * 2.2);
      const ringOpacity = 0.15 + (maxSeverity * 0.04);

      // Glassmorphism SVG marker
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="${ringRadius}" fill="${typeColor}" fill-opacity="${ringOpacity}" />
          <circle cx="25" cy="25" r="9" fill="${typeColor}" stroke="#FFFFFF" stroke-width="2" />
        </svg>
      `;

      const marker = new g.maps.Marker({
        position,
        map: mapInstance,
        title: `${humanizeIssueType(primary.issue_type, primary.description)} (${reports.length} reports)`,
        animation: g.maps.Animation.DROP, // Smooth drop animation
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
          scaledSize: new g.maps.Size(50, 50),
          anchor: new g.maps.Point(25, 25),
        },
        label: reports.length > 1 ? {
          text: reports.length.toString(),
          color: '#FFFFFF',
          fontSize: '9px',
          fontWeight: '800',
        } : undefined,
      });

      // Marker click handler
      marker.addListener('click', () => {
        onSelectIssue(primary.id);

        const avgSeverity = (reports.reduce((sum, r) => sum + r.severity, 0) / reports.length).toFixed(1);
        const firstReported = new Date(reports[reports.length - 1].created_at).toLocaleDateString();
        const lastReported = new Date(reports[0].created_at).toLocaleDateString();

        const infoContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; width: 200px; font-size: 11px; line-height: 1.5; color: #475569;">
            <div style="height: 100px; width: 100%; border-radius: 6px; overflow: hidden; background-color: #f1f5f9; margin-bottom: 8px;">
              <img src="${getImageUrl(primary.photo_url)}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 2px;">
              ${humanizeIssueType(primary.issue_type, primary.description)}
            </div>
            <div style="color: #64748b; font-size: 10px; font-weight: 500; margin-bottom: 6px;">
              📍 ${getLocalityName(primary.latitude, primary.longitude)}
            </div>
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
              <span style="font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 4px; border: 1px solid #f1f5f9; background-color: #f8fafc; text-transform: uppercase;">
                Avg Severity ${avgSeverity}/5
              </span>
              <span style="font-size: 8px; font-weight: 800; padding: 1.5px 5px; border-radius: 4px; color: #0d9488; background-color: #f0fdfa; border: 1px solid #ccfbf1; text-transform: uppercase;">
                ${primary.status}
              </span>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b;">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Reports:</span>
                <strong style="color: #0f172a;">${reports.length}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 2px;">
                <span>Timeline:</span>
                <strong style="color: #0f172a;">${firstReported} - ${lastReported}</strong>
              </div>
            </div>
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstance, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds
    if (groupedData.length === 1) {
      mapInstance.setCenter({ lat: groupedData[0].latitude, lng: groupedData[0].longitude });
      mapInstance.setZoom(14);
    } else {
      mapInstance.fitBounds(bounds);
      // Avoid excessive zooming on initialization
      boundsListener = g.maps.event.addListener(mapInstance, 'bounds_changed', () => {
        if (mapInstance.getZoom()! > 16) mapInstance.setZoom(16);
        if (boundsListener) {
          g.maps.event.removeListener(boundsListener);
          boundsListener = null;
        }
      });
    }

    return () => {
      if (boundsListener) {
        g.maps.event.removeListener(boundsListener);
      }
      markersRef.current.forEach((marker) => {
        g.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
    };
  }, [groupedData, mapInstance]);

  // Center Map & Open InfoWindow when selectedIssueId changes from list interaction
  useEffect(() => {
    if (!mapInstance || !selectedIssueId || markersRef.current.length === 0) return;

    const g = (window as any).google;

    // Find the corresponding marker index
    const targetGroup = groupedData.find((g) => g.reports.some((r) => r.id === selectedIssueId));
    if (!targetGroup) return;

    const markerIndex = groupedData.indexOf(targetGroup);
    const marker = markersRef.current[markerIndex];

    if (marker) {
      mapInstance.panTo(marker.getPosition()!);
      mapInstance.setZoom(15);
      // Trigger click event programmatically to show InfoWindow
      g.maps.event.trigger(marker, 'click');
    }
  }, [selectedIssueId, mapInstance, groupedData]);

  // Handle Geolocator click
  const handleGeolocate = () => {
    if (!mapInstance || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapInstance.panTo(pos);
        mapInstance.setZoom(14);
      },
      (error) => {
        console.error('Error fetching GPS for map panning:', error);
      }
    );
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-medium text-slate-500 font-sans text-xs min-h-[300px] text-center select-none">
        <AlertTriangle className="text-amber-500 mb-2 shrink-0" size={24} />
        <span className="font-semibold block mb-1 text-slate-700">Google Maps Unavailable</span>
        <span>The map module could not be initialized. Operating in list-only fallback mode.</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      {!mapsLoaded && (
        <div className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 select-none z-10 animate-fade">
          <Loader2 className="animate-spin text-primary" size={24} />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans">
            Configuring Operations Map...
          </span>
        </div>
      )}

      {/* Floating Interactive Map Legend Overlay */}
      {mapsLoaded && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-medium shadow-md text-[10px] space-y-2 select-none z-10 max-w-[150px] font-sans font-medium text-slate-700">
          <div className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1 text-[9px]">
            Operations Legend
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#EF4444' }} />
              <span>Road Damage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#F59E0B' }} />
              <span>Street Light</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#F97316' }} />
              <span>Garbage Overflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#3B82F6' }} />
              <span>Water Leak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#10B981' }} />
              <span>Footpath Slabs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: '#8B5CF6' }} />
              <span>Illegal Dumping</span>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-1 mt-1 font-bold text-[8.5px] text-slate-400 uppercase tracking-tight">
            Ring Size ∝ Severity Risk
          </div>
        </div>
      )}

      {/* Floating Geolocate Panner Button */}
      {mapsLoaded && (
        <button
          onClick={handleGeolocate}
          className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 border border-slate-200 p-2.5 rounded-medium shadow-md text-slate-650 hover:text-slate-800 transition-all select-none z-10 cursor-pointer active:scale-95"
          title="Pan to My Current Location"
          aria-label="Locate me"
        >
          <Navigation size={15} className="rotate-45" />
        </button>
      )}

      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '300px' }} />
    </div>
  );
};

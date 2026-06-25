import React, { useEffect, useState } from 'react';
import { MapPin, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onLocate: (coords: { lat: number; lng: number } | null) => void;
  className?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocate, className }) => {
  const { coordinates, loading, error, locate, setCoordinates } = useGeolocation(true);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // Sync coordinates with parent and local inputs when geolocation updates
  useEffect(() => {
    if (coordinates) {
      setManualLat(coordinates.lat.toString());
      setManualLng(coordinates.lng.toString());
      onLocate(coordinates);
    } else {
      onLocate(null);
    }
  }, [coordinates, onLocate]);

  // Handle manual input changes
  const handleLatChange = (val: string) => {
    setManualLat(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= -90 && parsed <= 90) {
      const updated = { lat: parsed, lng: coordinates?.lng || 0 };
      setCoordinates(updated);
    } else {
      onLocate(null);
    }
  };

  const handleLngChange = (val: string) => {
    setManualLng(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= -180 && parsed <= 180) {
      const updated = { lat: coordinates?.lat || 0, lng: parsed };
      setCoordinates(updated);
    } else {
      onLocate(null);
    }
  };

  return (
    <div className={cn('border border-secondary-border bg-white rounded-medium p-6 space-y-4', className)}>
      <div className="flex items-center justify-between gap-4 border-b border-secondary-border pb-3">
        <div className="flex items-center gap-2 text-slate-700">
          <MapPin size={18} className="text-primary shrink-0" />
          <span className="text-sm font-semibold font-sans">Report Location</span>
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-secondary-border rounded-small text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer select-none shadow-sm"
        >
          <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
          <span>{loading ? 'Locating...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Geolocation Lock Status */}
      {loading ? (
        <div className="text-xs text-slate-400 font-medium font-sans flex items-center gap-1.5 py-1">
          <RefreshCw size={14} className="animate-spin text-slate-300" />
          <span>Requesting GPS access from browser...</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 p-3 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-small select-none animate-fade">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">GPS Lock Failed</p>
            <p className="font-normal opacity-90">{error}</p>
          </div>
        </div>
      ) : coordinates ? (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-small select-none animate-fade">
          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">
            {isManualMode ? 'Manual Coordinates Registered' : 'GPS Location Locked'}
          </span>
        </div>
      ) : null}

      {/* Coordinates Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="latitude" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Latitude
          </label>
          <input
            id="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={manualLat}
            onChange={(e) => {
              setIsManualMode(true);
              handleLatChange(e.target.value);
            }}
            placeholder="e.g. 19.0760"
            className="w-full text-sm border border-secondary-border rounded-small px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="longitude" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Longitude
          </label>
          <input
            id="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={manualLng}
            onChange={(e) => {
              setIsManualMode(true);
              handleLngChange(e.target.value);
            }}
            placeholder="e.g. 72.8777"
            className="w-full text-sm border border-secondary-border rounded-small px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <p className="text-[10px] text-slate-400 leading-normal">
        GPS values are captured from your device's browser by default. You can manually adjust them above.
      </p>
    </div>
  );
};
export default LocationPicker;

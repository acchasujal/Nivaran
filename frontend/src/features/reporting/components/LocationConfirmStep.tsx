import React from 'react';
import { LocationPicker, type LocationCoordinates } from '../../../design-system/primitives/forms/LocationPicker';

export interface LocationConfirmStepProps {
  location: LocationCoordinates;
  onChangeLocation: (coords: LocationCoordinates) => void;
}

export const LocationConfirmStep: React.FC<LocationConfirmStepProps> = ({
  location,
  onChangeLocation,
}) => {
  return (
    <div className="space-y-4 font-sans">
      <LocationPicker
        label="Confirm Incident Geolocation"
        value={location}
        onChange={onChangeLocation}
      />
    </div>
  );
};

interface Locality {
  name: string;
  lat: number;
  lng: number;
}

const localities: Locality[] = [
  { name: 'Andheri East', lat: 19.1196, lng: 72.8791 },
  { name: 'Bandra West', lat: 19.0607, lng: 72.8362 },
  { name: 'Juhu', lat: 19.1000, lng: 72.8258 },
  { name: 'Powai', lat: 19.1200, lng: 72.9050 },
  { name: 'Dadar West', lat: 19.0178, lng: 72.8300 },
  { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
];

export const getLocalityName = (lat: number, lng: number): string => {
  let nearestLocality: Locality | null = null;
  let minDistance = Infinity;

  for (const locality of localities) {
    const distance = Math.sqrt(
      Math.pow(locality.lat - lat, 2) + Math.pow(locality.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocality = locality;
    }
  }

  // If it's within a reasonable threshold (approx 5-10km or ~0.08 degrees), return the name
  if (nearestLocality && minDistance < 0.08) {
    return nearestLocality.name;
  }

  // Otherwise, return formatted coordinates
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

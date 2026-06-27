interface Locality {
  name: string;
  lat: number;
  lng: number;
  ward: string;
}

const localities: Locality[] = [
  { name: 'Andheri East', lat: 19.1196, lng: 72.8791, ward: 'K/E Ward' },
  { name: 'Bandra West', lat: 19.0607, lng: 72.8362, ward: 'H/W Ward' },
  { name: 'Juhu', lat: 19.1000, lng: 72.8258, ward: 'K/W Ward' },
  { name: 'Powai', lat: 19.1200, lng: 72.9050, ward: 'S Ward' },
  { name: 'Dadar West', lat: 19.0178, lng: 72.8300, ward: 'G/N Ward' },
  { name: 'Colaba', lat: 18.9067, lng: 72.8147, ward: 'A Ward' },
  { name: 'Kurla', lat: 19.0726, lng: 72.8844, ward: 'L Ward' },
  { name: 'Chembur', lat: 19.0622, lng: 72.8974, ward: 'M/W Ward' },
  { name: 'Ghatkopar', lat: 19.0864, lng: 72.9082, ward: 'N Ward' },
  { name: 'Vikhroli', lat: 19.1112, lng: 72.9276, ward: 'S Ward' },
  { name: 'Borivali', lat: 19.2307, lng: 72.8567, ward: 'R/C Ward' },
  { name: 'Sion', lat: 19.0373, lng: 72.8634, ward: 'F/N Ward' },
];

export const getLocalityAndWard = (lat: number, lng: number): { locality: string; ward: string } => {
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

  if (nearestLocality && minDistance < 0.08) {
    return { locality: nearestLocality.name, ward: nearestLocality.ward };
  }

  return {
    locality: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    ward: 'Unknown Ward'
  };
};

export const getLocalityName = (lat: number, lng: number): string => {
  return getLocalityAndWard(lat, lng).locality;
};


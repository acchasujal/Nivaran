
/**
 * Humanizes issue type key into a readable label, factoring in description content
 */
export const humanizeIssueType = (type: string, desc = ''): string => {
  const d = desc.toLowerCase();
  if (d.includes('footpath') || d.includes('sidewalk')) return 'Broken Footpath';
  if (d.includes('dumping') || d.includes('debris') || d.includes('construction debris') || d.includes('illegal dumping')) return 'Illegal Dumping';
  if (d.includes('pothole') || d.includes('road damage') || d.includes('road surface')) return 'Road Damage';
  if (d.includes('streetlight') || d.includes('light') || d.includes('outage')) return 'Street Lighting';
  if (d.includes('leak') || d.includes('pipeline') || d.includes('water supply')) return 'Water Leakage';
  if (d.includes('garbage') || d.includes('waste') || d.includes('refuse') || d.includes('dump')) return 'Garbage Overflow';
  
  switch (type) {
    case 'road_damage': return 'Road Damage';
    case 'street_lighting': return 'Street Lighting';
    case 'water': return 'Water Leakage';
    case 'garbage': return 'Garbage Overflow';
    case 'footpath': return 'Broken Footpath';
    case 'dumping': return 'Illegal Dumping';
    default: return 'Other Civic Issue';
  }
};

/**
 * Gets the color class for the issue type tag
 */
export const getIssueTypeBadgeColor = (type: string, desc = ''): string => {
  const title = humanizeIssueType(type, desc);
  switch (title) {
    case 'Road Damage': return 'bg-teal-50 border-teal-200 text-teal-700';
    case 'Street Lighting': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'Water Leakage': return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'Garbage Overflow': return 'bg-stone-100 border-stone-250 text-stone-700';
    case 'Broken Footpath': return 'bg-cyan-50 border-cyan-200 text-cyan-700';
    case 'Illegal Dumping': return 'bg-orange-50 border-orange-200 text-orange-700';
    default: return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

/**
 * Gets background color class for severity levels
 */
export const getSeverityBg = (sev: number): string => {
  if (sev >= 4) return 'bg-rose-600';
  if (sev >= 3) return 'bg-amber-500';
  return 'bg-emerald-650';
};

/**
 * Gets background & text color classes for severity number badges
 */
export const getSeverityBadgeColor = (sev: number, isActive: boolean): string => {
  if (!isActive) return 'bg-slate-50 text-slate-350 border-slate-100';
  if (sev >= 4) return 'bg-rose-50 border-rose-200 text-rose-700';
  if (sev >= 3) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-emerald-50 border-emerald-200 text-emerald-700';
};

/**
 * Formats full datetime string
 */
export const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoString;
  }
};

/**
 * Formats date string only
 */
export const formatDateOnly = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return isoString;
  }
};

/**
 * Gets human-readable relative time representation
 */
export const getRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) return 'Just now';
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return '1d ago';
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

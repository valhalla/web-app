export function parseGpxToLatLng(xmlText: string): [number, number][] {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');

  // basic error handling
  const parserError = doc.querySelector('parsererror');
  if (parserError) return [];

  const pts = Array.from(doc.querySelectorAll('trkpt, rtept'));
  const coords: [number, number][] = [];

  for (const pt of pts) {
    const latStr = pt.getAttribute('lat');
    const lonStr = pt.getAttribute('lon');
    const lat = latStr ? Number(latStr) : NaN;
    const lon = lonStr ? Number(lonStr) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    coords.push([lat, lon]);
  }

  return coords;
}

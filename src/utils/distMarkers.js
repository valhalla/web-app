import * as turf from '@turf/turf'

const distMarkers = (coords) => {
  let totalDist = 0.0
  const distmarkers = []
  let markerDist = 1000
  let coordIdx = 0
  const latLons = []
  for (let i = 0; i < coords.length; i++) {
    latLons.push(turf.point([coords[i][1], coords[i][0]]))
  }
  while (coordIdx < latLons.length - 1) {
    const start = latLons[coordIdx]
    const end = latLons[coordIdx + 1]
    const segDist = turf.distance(start, end) * 1000.0
    while (totalDist + segDist > markerDist) {
      distmarkers.push({ idx: coordIdx, dist: markerDist - totalDist })
      markerDist += 1000.0
    }
    coordIdx++
    totalDist += segDist
  }
  const ret = []
  for (let i = 0; i < distmarkers.length; i++) {
    const bearing = turf.bearing(
      latLons[distmarkers[i].idx],
      latLons[distmarkers[i].idx + 1]
    )
    const newPoint = turf.destination(
      latLons[distmarkers[i].idx],
      distmarkers[i].dist / 1000.0,
      bearing
    )
    ret.push(newPoint)
  }
  return ret
}
export default distMarkers

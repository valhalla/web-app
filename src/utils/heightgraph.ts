const deriveHeightClass = (slope) => {
  let heightClass
  switch (true) {
    case slope < -15:
      heightClass = -5
      break
    case -15 <= slope && -10 > slope:
      heightClass = -4
      break
    case -10 <= slope && -7 > slope:
      heightClass = -3
      break
    case -7 <= slope && -4 > slope:
      heightClass = -2
      break
    case -4 <= slope && -1 > slope:
      heightClass = -1
      break
    case -1 <= slope && 1 > slope:
      heightClass = 0
      break
    case 1 <= slope && 3 > slope:
      heightClass = 1
      break
    case 3 <= slope && 6 > slope:
      heightClass = 2
      break
    case 6 <= slope && 9 > slope:
      heightClass = 3
      break
    case 9 <= slope && 15 > slope:
      heightClass = 4
      break
    case slope >= 15:
      heightClass = 5
      break
    default:
      break
  }
  return heightClass
}

export const buildHeightgraphData = (coordinates, rangeHeightData) => {
  const features = []

  let LineStringCoordinates = []
  let previousHeightClass

  let inclineTotal = 0
  let declineTotal = 0

  rangeHeightData.forEach((item, index) => {
    if (index < rangeHeightData.length - 1) {
      const riseThis = item[1]
      const riseNext = rangeHeightData[index + 1][1]
      const rise = riseNext - riseThis
      const run = rangeHeightData[index + 1][0] - item[0]

      const slope = (rise / run) * 100
      const heightClass = isNaN(slope) ? 0 : deriveHeightClass(slope)

      if (rise > 0) {
        inclineTotal += rise
      } else if (rise < 0) {
        declineTotal += rise * -1
      }

      // IDEA FOR BUILDING GEOJSON FOR HEIGHTGRAPH:
      // Basic idea is keepon adding points to current LineString as long as they have same heightClass
      // If we sense that the heightClass has changed, we add current LineString as one feature in GeoJSON
      // new heightClass new LineString
      // height graph works by taking a geojson with collection of LineStrings and coloring them based on heightClass property

      // this checks if heightClass has changed and we need to add current LineString as one feature in GeoJSON
      if (previousHeightClass !== heightClass) {
        // since at this point we have a change in height class this will be the last point in current LineString
        LineStringCoordinates.push([
          coordinates[index][0],
          coordinates[index][1],
          rangeHeightData[index][1],
        ])

        // add current LineString as one feature in GeoJSON
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: LineStringCoordinates,
          },
          properties: {
            // attributeType is previousHeightClass because it is the heightClass upto this point in current LineString
            // this is closing the linestring with all the points having same heightClass
            attributeType: previousHeightClass || 0,
          },
        })
        // reset LineStringCoordinates and prepare it for new GeoJSON feature
        LineStringCoordinates = []
      }
      // current point is also the stratting point for new LineString
      LineStringCoordinates.push([
        coordinates[index][0],
        coordinates[index][1],
        rangeHeightData[index][1],
      ])
      // replace previousHeightClass with current heightClass
      previousHeightClass = heightClass
    }
  })

  return [
    {
      type: 'FeatureCollection',
      features: features,
      properties: {
        summary: 'steepness',
        inclineTotal,
        declineTotal,
      },
    },
  ]
}

export const colorMappings = {
  steepness: {
    '-5': {
      text: '16%+',
      color: '#028306',
    },
    '-4': {
      text: '10-15%',
      color: '#2AA12E',
    },
    '-3': {
      text: '7-9%',
      color: '#53BF56',
    },
    '-2': {
      text: '4-6%',
      color: '#7BDD7E',
    },
    '-1': {
      text: '1-3%',
      color: '#A4FBA6',
    },
    0: {
      text: '0%',
      color: '#ffcc99',
    },
    1: {
      text: '1-3%',
      color: '#F29898',
    },
    2: {
      text: '4-6%',
      color: '#E07575',
    },
    3: {
      text: '7-9%',
      color: '#CF5352',
    },
    4: {
      text: '10-15%',
      color: '#BE312F',
    },
    5: {
      text: '16%+',
      color: '#AD0F0C',
    },
  },
}

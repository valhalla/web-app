export const roadClassNames: Record<number, string> = {
  0: 'Motorway',
  1: 'Trunk',
  2: 'Primary',
  3: 'Secondary',
  4: 'Tertiary',
  5: 'Unclassified',
  6: 'Residential',
  7: 'Service/Other',
};

export const useNames: Record<number, string> = {
  0: 'Road',
  1: 'Ramp',
  2: 'Turn Channel',
  3: 'Track',
  4: 'Driveway',
  5: 'Alley',
  6: 'Parking Aisle',
  7: 'Emergency Access',
  8: 'Drive-Through',
  9: 'Culdesac',
  10: 'Cycleway',
  11: 'Mountain Bike',
  12: 'Sidewalk',
  13: 'Footway',
  14: 'Steps',
  15: 'Path',
  16: 'Pedestrian',
  17: 'Bridleway',
  18: 'Other',
  19: 'Ferry',
  20: 'Rail-Ferry',
  21: 'Construction',
  22: 'Transit Connection',
};

export const hovTypeNames: Record<number, string> = {
  0: 'None',
  1: 'HOV2',
  2: 'HOV3',
  3: 'HOV2+',
};

export const speedTypeNames: Record<number, string> = {
  0: 'Tagged',
  1: 'Classified',
  2: 'Average',
};

export const surfaceNames: Record<number, string> = {
  0: 'Paved Smooth',
  1: 'Paved',
  2: 'Paved Rough',
  3: 'Compacted',
  4: 'Dirt',
  5: 'Gravel',
  6: 'Path',
  7: 'Impassable',
};

export const cyclelaneNames: Record<number, string> = {
  0: 'None',
  1: 'Shared',
  2: 'Dedicated',
  3: 'Separated',
};

export const sacScaleNames: Record<number, string> = {
  0: 'None',
  1: 'Hiking',
  2: 'Mountain Hiking',
  3: 'Demanding Mountain Hiking',
  4: 'Alpine Hiking',
  5: 'Demanding Alpine Hiking',
  6: 'Difficult Alpine Hiking',
};

export const nodeTypeNames: Record<number, string> = {
  0: 'Street Intersection',
  1: 'Gate',
  2: 'Bollard',
  3: 'Toll Booth',
  4: 'Multi-Use Transit Stop',
  5: 'Bike Share',
  6: 'Parking',
  7: 'Motor Way Junction',
  8: 'Border Control',
  9: 'Toll Gantry',
  10: 'Sump Buster',
  11: 'Building Entrance',
  12: 'Elevator',
};

export const intersectionTypeNames: Record<number, string> = {
  0: 'Regular',
  1: 'Fork',
  2: 'Dead End',
  3: 'True/False',
};

export const propertyNameMappings: Record<string, Record<number, string>> = {
  road_class: roadClassNames,
  use: useNames,
  hov_type: hovTypeNames,
  speed_type: speedTypeNames,
  surface: surfaceNames,
  cyclelane: cyclelaneNames,
  sac_scale: sacScaleNames,
  node_type: nodeTypeNames,
  intersection_type: intersectionTypeNames,
};

export const accessFlagNames: Record<number, string> = {
  0: 'None',
  1: 'Auto',
  2: 'Pedestrian',
  4: 'Bicycle',
  8: 'Truck',
  16: 'Emergency',
  32: 'Taxi',
  64: 'Bus',
  128: 'HOV',
  256: 'Wheelchair',
  512: 'Moped',
  1024: 'Motorcycle',
};

export const bikeNetworkFlagNames: Record<number, string> = {
  0: 'None',
  1: 'National',
  2: 'Regional',
  4: 'Local',
  8: 'Mountain',
};

export const bitmaskPropertyMappings: Record<string, Record<number, string>> = {
  'access:fwd': accessFlagNames,
  'access:bwd': accessFlagNames,
  access: accessFlagNames,
  bike_network: bikeNetworkFlagNames,
};

export interface ActiveWaypoint {
  title: string;
  description?: string;
  selected?: boolean;
  addresslnglat?: [number, number];
  sourcelnglat?: [number, number];
  displaylnglat: [number, number];
  key: number;
  addressindex: number;
}

export type ActiveWaypoints = ActiveWaypoint[];

export type Settings = Record<
  'costing' | 'directions',
  {
    [key in keyof PossibleSettings]: PossibleSettings[key];
  }
>;

export type BicycleType = 'Hybrid' | 'Road' | 'City' | 'Cross' | 'Mountain';

export interface PossibleSettings {
  maneuver_penalty: number;
  country_crossing_penalty: number;
  country_crossing_cost: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  axle_load: number;
  hazmat: boolean;
  use_highways: number;
  use_tolls: number;
  use_ferry: number;
  ferry_cost: number;
  use_living_streets: number;
  use_tracks: number;
  private_access_penalty: number;
  ignore_closures: boolean;
  ignore_restrictions: boolean;
  ignore_access: boolean;
  closure_factor: number;
  service_penalty: number;
  service_factor: number;
  exclude_unpaved: boolean;
  shortest: boolean;
  exclude_cash_only_tolls: boolean;
  bicycle_type: BicycleType;
  cycling_speed: number;
  use_roads: number;
  use_hills: number;
  avoid_bad_surfaces: number;
  top_speed: number;
  use_primary: number;
  walking_speed: number;
  walkway_factor: number;
  sidewalk_factor: number;
  alley_factor: number;
  driveway_factor: number;
  step_penalty: number;
  max_hiking_difficulty: number;
  exclude_polygons: GeoJSON.GeoJSON[];
  use_geocoding: boolean;
  use_lit: number;
  axle_count: number;
  fixed_speed: number;
  toll_booth_penalty: number;
  toll_booth_cost: number;
  gate_penalty: number;
  gate_cost: number;
  include_hov2: boolean;
  include_hov3: boolean;
  include_hot: boolean;
  transit_start_end_max_distance: number;
  transit_transfer_max_distance: number;
  disable_hierarchy_pruning: boolean;
  use_trails: number;
  denoise: number;
  generalize: number;
  alternates: number;
  speed_types: string[];
  [key: string]:
    | string
    | string[]
    | number
    | boolean
    | GeoJSON.GeoJSON[]
    | undefined;
}

export interface ParsedDirectionsGeometry {
  trip: Trip;
  id: string;
  decodedGeometry: number[][];
  alternates?: ValhallaRouteResponse[];
}

export interface Trip {
  locations: Location[];
  legs: Leg[];
  summary: Summary;
  status_message: string;
  status: number;
  units: string;
  language: string;
}

export interface Location {
  type: string;
  lat: number;
  lon: number;
  side_of_street: string;
  original_index: number;
}

export interface Leg {
  maneuvers: Maneuver[];
  summary: Summary;
  shape: string;
}

export interface Maneuver {
  type: number;
  instruction: string;
  verbal_succinct_transition_instruction?: string;
  verbal_pre_transition_instruction: string;
  verbal_post_transition_instruction?: string;
  street_names?: string[];
  bearing_after?: number;
  time: number;
  length: number;
  cost: number;
  begin_shape_index: number;
  end_shape_index: number;
  verbal_multi_cue?: boolean;
  travel_mode: string;
  travel_type: string;
  verbal_transition_alert_instruction?: string;
  bearing_before?: number;
  roundabout_exit_count?: number;
  begin_street_names?: string[];
  rough?: boolean;
  toll?: boolean;
  ferry?: boolean;
}

export interface Summary {
  has_time_restrictions: boolean;
  has_toll: boolean;
  has_highway: boolean;
  has_ferry: boolean;
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  time: number;
  length: number;
  cost: number;
}

export interface IsochronesRequestParams {
  profile: string;
  center: Center;
  settings: Settings;
  denoise: number;
  generalize: number;
  maxRange: number;
  interval: number;
}

export interface Center {
  title: string;
  description: string;
  selected: boolean;
  addresslnglat: number[];
  sourcelnglat: number[];
  displaylnglat: number[];
  key: number;
  addressindex: number;
}

export interface Costing {
  maneuver_penalty: number;
  use_ferry: number;
  use_living_streets: number;
  service_penalty: number;
  service_factor: number;
  shortest: boolean;
  bicycle_type: string;
  cycling_speed: number;
  use_roads: number;
  use_hills: number;
  avoid_bad_surfaces: number;
  gate_penalty: number;
  gate_cost: number;
}

export interface Directions {
  alternates: number;
  exclude_polygons: GeoJSON.GeoJSON[];
}

export interface NominationResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: Address;
  boundingbox: string[];
}

export interface Address {
  suburb: string;
  town: string;
  state: string;
  'ISO3166-2-lvl4'?: string;
  region: string;
  postcode: string;
  country: string;
  country_code: string;
}

export interface ValhallaRouteResponse {
  id: 'valhalla_directions';
  trip: Trip;
  alternates?: ValhallaRouteResponse[];
}

export interface ValhallaIsochroneResponse extends GeoJSON.FeatureCollection {
  id: string;
}

export interface FetchGeocodeObject {
  inputValue: string;
  lngLat?: [number, number];
  index?: number;
}

export type PossibleTabValues = 'directions' | 'isochrones';

export interface OptimizedLocation {
  type: string;
  lat: number;
  lon: number;
  original_index: number;
}

export interface ValhallaOptimizedRouteResponse {
  trip: Trip;
  id?: string;
}

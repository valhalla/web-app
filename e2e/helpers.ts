import type { Page, Route } from '@playwright/test';

interface ApiRequest {
  url: string;
  method: string;
  params?: {
    lon?: string | null;
    lat?: string | null;
    format?: string | null;
  };
  body?: Record<string, unknown>;
}

export const BERLIN_COORDINATES = {
  lat: 52.507027222951635,
  lon: 13.385467529296877,
  bounds: {
    minLat: 52.0,
    maxLat: 53.0,
    minLon: 13.0,
    maxLon: 14.0,
  },
};

export const mockStatusResponse = {
  version: '3.5.1-658c9b5ca',
  tileset_last_modified: 1758082755,
  available_actions: [
    'expansion',
    'height',
    'status',
    'trace_attributes',
    'trace_route',
    'optimized_route',
    'sources_to_targets',
    'isochrone',
    'route',
    'locate',
  ],
};

export const mockNominatimResponse = {
  place_id: 123456,
  licence: 'Data © OpenStreetMap contributors, ODbL 1.0.',
  osm_type: 'way',
  osm_id: 12345,
  lat: BERLIN_COORDINATES.lat.toString(),
  lon: BERLIN_COORDINATES.lon.toString(),
  display_name: 'Unter den Linden, Mitte, Berlin, Germany',
  address: {
    road: 'Unter den Linden',
    suburb: 'Mitte',
    city: 'Berlin',
    country: 'Germany',
    country_code: 'de',
  },
};

export const simpleMockNominatimResponse = {
  place_id: 123456,
  lat: BERLIN_COORDINATES.lat.toString(),
  lon: BERLIN_COORDINATES.lon.toString(),
  display_name: 'Brandenburg Gate, Berlin, Germany',
};

export const mockRouteResponse = {
  trip: {
    locations: [
      {
        type: 'break',
        lat: 52.534811,
        lon: 13.360748,
        side_of_street: 'right',
        original_index: 0,
      },
      {
        type: 'break',
        lat: 52.502429,
        lon: 13.373451,
        original_index: 1,
      },
    ],
    legs: [
      {
        maneuvers: [
          {
            type: 2,
            instruction: 'Bike southeast.',
            verbal_succinct_transition_instruction: 'Bike southeast.',
            verbal_pre_transition_instruction: 'Bike southeast.',
            verbal_post_transition_instruction: 'Continue for 800 meters.',
            bearing_after: 147,
            time: 139.839,
            length: 0.768,
            cost: 258.696,
            begin_shape_index: 0,
            end_shape_index: 13,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left onto Döberitzer Straße.',
            verbal_transition_alert_instruction:
              'Turn left onto Döberitzer Straße.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction:
              'Turn left onto Döberitzer Straße.',
            verbal_post_transition_instruction: 'Continue for 100 meters.',
            street_names: ['Döberitzer Straße'],
            bearing_before: 137,
            bearing_after: 68,
            time: 65.146,
            length: 0.122,
            cost: 443.177,
            begin_shape_index: 13,
            end_shape_index: 20,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right onto Heidestraße/B 96.',
            verbal_transition_alert_instruction: 'Turn right onto Heidestraße.',
            verbal_succinct_transition_instruction: 'Turn right.',
            verbal_pre_transition_instruction:
              'Turn right onto Heidestraße, B 96.',
            verbal_post_transition_instruction: 'Continue for 80 meters.',
            street_names: ['Heidestraße', 'B 96'],
            bearing_before: 69,
            bearing_after: 158,
            time: 13.628,
            length: 0.082,
            cost: 58.346,
            begin_shape_index: 20,
            end_shape_index: 23,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right toward B 96/Schöneberg/Kreuzberg.',
            verbal_transition_alert_instruction: 'Turn right toward B 96.',
            verbal_succinct_transition_instruction:
              'Turn right toward B 96, Schöneberg.',
            verbal_pre_transition_instruction:
              'Turn right toward B 96, Schöneberg.',
            verbal_post_transition_instruction:
              'Continue on Minna-Cauer-Straße for 400 meters.',
            street_names: ['Minna-Cauer-Straße'],
            begin_street_names: ['Minna-Cauer-Straße', 'B 96'],
            bearing_before: 157,
            bearing_after: 239,
            time: 65.117,
            length: 0.39,
            cost: 136.228,
            begin_shape_index: 23,
            end_shape_index: 48,
            sign: {},
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right toward A 100.',
            verbal_transition_alert_instruction: 'Turn right toward A 100.',
            verbal_succinct_transition_instruction: 'Turn right toward A 100.',
            verbal_pre_transition_instruction: 'Turn right toward A 100.',
            verbal_post_transition_instruction: 'Continue for 200 meters.',
            street_names: ['Invalidenstraße'],
            bearing_before: 158,
            bearing_after: 240,
            time: 34.304,
            length: 0.151,
            cost: 124.472,
            begin_shape_index: 48,
            end_shape_index: 53,
            sign: {},
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left toward Hauptbahnhof.',
            verbal_transition_alert_instruction:
              'Turn left toward Hauptbahnhof.',
            verbal_succinct_transition_instruction:
              'Turn left toward Hauptbahnhof.',
            verbal_pre_transition_instruction: 'Turn left toward Hauptbahnhof.',
            verbal_post_transition_instruction: 'Continue for 200 meters.',
            street_names: ['Clara-Jaschke-Straße'],
            bearing_before: 238,
            bearing_after: 131,
            time: 53.684,
            length: 0.249,
            cost: 108.073,
            begin_shape_index: 53,
            end_shape_index: 75,
            sign: {},
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left onto Bertha-Benz-Straße.',
            verbal_transition_alert_instruction:
              'Turn left onto Bertha-Benz-Straße.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction:
              'Turn left onto Bertha-Benz-Straße.',
            verbal_post_transition_instruction: 'Continue for 100 meters.',
            street_names: ['Bertha-Benz-Straße'],
            bearing_before: 179,
            bearing_after: 90,
            time: 41.041,
            length: 0.141,
            cost: 93.726,
            begin_shape_index: 75,
            end_shape_index: 86,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right onto Ella-Trebe-Straße.',
            verbal_transition_alert_instruction:
              'Turn right onto Ella-Trebe-Straße.',
            verbal_succinct_transition_instruction: 'Turn right.',
            verbal_pre_transition_instruction:
              'Turn right onto Ella-Trebe-Straße.',
            verbal_post_transition_instruction: 'Continue for 80 meters.',
            street_names: ['Ella-Trebe-Straße'],
            bearing_before: 90,
            bearing_after: 180,
            time: 20.584,
            length: 0.082,
            cost: 48.143,
            begin_shape_index: 86,
            end_shape_index: 95,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right onto Rahel-Hirsch-Straße.',
            verbal_transition_alert_instruction:
              'Turn right onto Rahel-Hirsch-Straße.',
            verbal_succinct_transition_instruction:
              'Turn right. Then Turn left onto Moltkebrücke.',
            verbal_pre_transition_instruction:
              'Turn right onto Rahel-Hirsch-Straße. Then Turn left onto Moltkebrücke.',
            verbal_post_transition_instruction: 'Continue for 30 meters.',
            street_names: ['Rahel-Hirsch-Straße'],
            bearing_before: 166,
            bearing_after: 223,
            time: 7.92,
            length: 0.029,
            cost: 36.759,
            begin_shape_index: 95,
            end_shape_index: 99,
            verbal_multi_cue: true,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left onto Moltkebrücke.',
            verbal_transition_alert_instruction: 'Turn left onto Moltkebrücke.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction: 'Turn left onto Moltkebrücke.',
            verbal_post_transition_instruction: 'Continue for 100 meters.',
            street_names: ['Moltkebrücke'],
            bearing_before: 213,
            bearing_after: 142,
            time: 27.04,
            length: 0.116,
            cost: 68.274,
            begin_shape_index: 99,
            end_shape_index: 103,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 8,
            instruction: 'Continue on Willy-Brandt-Straße.',
            verbal_transition_alert_instruction:
              'Continue on Willy-Brandt-Straße.',
            verbal_pre_transition_instruction:
              'Continue on Willy-Brandt-Straße.',
            verbal_post_transition_instruction: 'Continue for 300 meters.',
            street_names: ['Willy-Brandt-Straße'],
            bearing_before: 133,
            bearing_after: 129,
            time: 65.415,
            length: 0.275,
            cost: 129.892,
            begin_shape_index: 103,
            end_shape_index: 114,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 8,
            instruction: 'Continue on Heinrich-von-Gagern-Straße.',
            verbal_transition_alert_instruction:
              'Continue on Heinrich-von-Gagern-Straße.',
            verbal_pre_transition_instruction:
              'Continue on Heinrich-von-Gagern-Straße.',
            verbal_post_transition_instruction: 'Continue for 400 meters.',
            street_names: ['Heinrich-von-Gagern-Straße'],
            bearing_before: 180,
            bearing_after: 180,
            time: 79.557,
            length: 0.41,
            cost: 198.702,
            begin_shape_index: 114,
            end_shape_index: 127,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 9,
            instruction: 'Bear right onto the cycleway.',
            verbal_transition_alert_instruction:
              'Bear right onto the cycleway.',
            verbal_succinct_transition_instruction:
              'Bear right. Then Continue.',
            verbal_pre_transition_instruction:
              'Bear right onto the cycleway. Then Continue.',
            verbal_post_transition_instruction: 'Continue for 50 meters.',
            bearing_before: 184,
            bearing_after: 227,
            time: 25.293,
            length: 0.049,
            cost: 65.833,
            begin_shape_index: 127,
            end_shape_index: 133,
            verbal_multi_cue: true,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 8,
            instruction: 'Continue.',
            verbal_transition_alert_instruction: 'Continue.',
            verbal_pre_transition_instruction:
              'Continue. Then Turn right onto Bremer Weg.',
            verbal_post_transition_instruction: 'Continue for 30 meters.',
            bearing_before: 212,
            bearing_after: 196,
            time: 8.078,
            length: 0.026,
            cost: 19.361,
            begin_shape_index: 133,
            end_shape_index: 135,
            verbal_multi_cue: true,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right onto Bremer Weg.',
            verbal_transition_alert_instruction: 'Turn right onto Bremer Weg.',
            verbal_succinct_transition_instruction: 'Turn right.',
            verbal_pre_transition_instruction: 'Turn right onto Bremer Weg.',
            verbal_post_transition_instruction: 'Continue for 200 meters.',
            street_names: ['Bremer Weg'],
            bearing_before: 196,
            bearing_after: 266,
            time: 44.907,
            length: 0.225,
            cost: 88.153,
            begin_shape_index: 135,
            end_shape_index: 141,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left.',
            verbal_transition_alert_instruction: 'Turn left.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction: 'Turn left.',
            verbal_post_transition_instruction: 'Continue for 200 meters.',
            bearing_before: 263,
            bearing_after: 171,
            time: 51.355,
            length: 0.226,
            cost: 112.713,
            begin_shape_index: 141,
            end_shape_index: 149,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left onto Bellevueallee.',
            verbal_transition_alert_instruction:
              'Turn left onto Bellevueallee.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction: 'Turn left onto Bellevueallee.',
            verbal_post_transition_instruction: 'Continue for 400 meters.',
            street_names: ['Bellevueallee'],
            bearing_before: 203,
            bearing_after: 118,
            time: 72.987,
            length: 0.417,
            cost: 149.007,
            begin_shape_index: 149,
            end_shape_index: 155,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 16,
            instruction: 'Bear left onto the cycleway.',
            verbal_transition_alert_instruction: 'Bear left onto the cycleway.',
            verbal_succinct_transition_instruction: 'Bear left.',
            verbal_pre_transition_instruction: 'Bear left onto the cycleway.',
            verbal_post_transition_instruction: 'Continue for 200 meters.',
            bearing_before: 165,
            bearing_after: 128,
            time: 72.96,
            length: 0.23,
            cost: 170.325,
            begin_shape_index: 155,
            end_shape_index: 169,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction:
              'Turn right onto Potsdamer Straße/B 1. Continue on B 1.',
            verbal_transition_alert_instruction:
              'Turn right onto Potsdamer Straße.',
            verbal_succinct_transition_instruction: 'Turn right.',
            verbal_pre_transition_instruction:
              'Turn right onto Potsdamer Straße, B 1.',
            verbal_post_transition_instruction:
              'Continue on B 1 for 400 meters.',
            street_names: ['B 1'],
            begin_street_names: ['Potsdamer Straße', 'B 1'],
            bearing_before: 165,
            bearing_after: 263,
            time: 79.856,
            length: 0.442,
            cost: 206.721,
            begin_shape_index: 169,
            end_shape_index: 206,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 16,
            instruction: 'Bear left onto Potsdamer Brücke.',
            verbal_transition_alert_instruction:
              'Bear left onto Potsdamer Brücke.',
            verbal_succinct_transition_instruction:
              'Bear left. Then Turn left onto Schöneberger Ufer.',
            verbal_pre_transition_instruction:
              'Bear left onto Potsdamer Brücke. Then Turn left onto Schöneberger Ufer.',
            verbal_post_transition_instruction: 'Continue for 40 meters.',
            street_names: ['Potsdamer Brücke'],
            bearing_before: 202,
            bearing_after: 169,
            time: 5.489,
            length: 0.035,
            cost: 15.887,
            begin_shape_index: 206,
            end_shape_index: 211,
            verbal_multi_cue: true,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 15,
            instruction: 'Turn left onto Schöneberger Ufer.',
            verbal_transition_alert_instruction:
              'Turn left onto Schöneberger Ufer.',
            verbal_succinct_transition_instruction: 'Turn left.',
            verbal_pre_transition_instruction:
              'Turn left onto Schöneberger Ufer.',
            verbal_post_transition_instruction: 'Continue for 500 meters.',
            street_names: ['Schöneberger Ufer'],
            bearing_before: 166,
            bearing_after: 89,
            time: 88.851,
            length: 0.486,
            cost: 176.304,
            begin_shape_index: 211,
            end_shape_index: 246,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 10,
            instruction: 'Turn right.',
            verbal_transition_alert_instruction: 'Turn right.',
            verbal_succinct_transition_instruction: 'Turn right.',
            verbal_pre_transition_instruction: 'Turn right.',
            verbal_post_transition_instruction: 'Continue for 80 meters.',
            bearing_before: 135,
            bearing_after: 195,
            time: 19.637,
            length: 0.075,
            cost: 42.1,
            begin_shape_index: 246,
            end_shape_index: 253,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
          {
            type: 4,
            instruction: 'You have arrived at your destination.',
            verbal_transition_alert_instruction:
              'You will arrive at your destination.',
            verbal_pre_transition_instruction:
              'You have arrived at your destination.',
            bearing_before: 188,
            time: 0,
            length: 0,
            cost: 0,
            begin_shape_index: 253,
            end_shape_index: 253,
            travel_mode: 'bicycle',
            travel_type: 'hybrid',
          },
        ],
        summary: {
          has_time_restrictions: false,
          has_toll: false,
          has_highway: false,
          has_ferry: false,
          min_lat: 52.502431,
          min_lon: 13.361159,
          max_lat: 52.534975,
          max_lon: 13.373645,
          time: 1082.698,
          length: 5.029,
          cost: 2750.902,
        },
        shape:
          '_knecBm_onXlAsAlkAypA`iAmnAhYoYjQyNxRyPvg@mk@lr@wbAvEy@fD}@|BeBvBmBl[oj@q@mEwBoNkGma@gBmLiCqPWeBcBkLbLyGbS{LpHqEbCnJfFfSzG|ShG|NrIrNnFtFfIrInEtEdBrDx@x@fE`CrE|AxDp@pIv@jc@dBl[lAhB@t@EbAM~@UzAq@bAi@dAi@pAw@vBoAlCxKnOdu@bHx\\b@tBhGxTjAoCn@wA~AuDtCyGj@a@^UzAeA`CoArDqAtCUxEIpCIh@CnAEf@AfBGj@C~Sq@xHWhFQxDCnb@[?q@AmD?yAAol@?k@A}F@eF?m@Dsl@@kA?}E^?d@?hA?\\?xC?pG?nSA`AYjDeAtBbE|@jAzApA~BxCvF_IZs@l@wAhb@g}@Pc@zDyIz@kBp\\gu@`CoF|IyRx@aBpA?j_A@dA?pA?xB?vE@jC?|wA^`A@~D`AvEfBr@XhBnAnS|IfhAhf@~D~@b@BzA`D|BtCdBRfFx@bDb@z@|@bA^~JnD\\|S|@bc@dBnw@j@tO\\bOpCxz@jm@sJvH`AxPzDdH|AhFbChClAbLzGpNzIl_A_cEhEeRrXmmAbCsKdKkDpHcChAyCZy@nC{@|B}@tCkAh@ObH}BhGwAvY_FrZ{EtY}EbAO~B[lBo@LrDPlHj@~LZtEf@xE|@bFr@pC^hAf@zAnAdDvHpRfDpIhCnGfArC`CpFpAxBjA`BhBtBd@^jAbAzAdAxBjAhAl@bf@fUhFfClD`BzCtAjEx@tCx@hA^|DhArf@nT|@^l@V~CtAzDvBxCfB`C_@rBi@rBi@hBi@rC{@AaGBgBD{AFmAHaA^gD\\}C^kDz@eI|@qHjAyGlCwNhIa\\vNsf@`@iAvOgf@Xy@ZiAnAuD~AmEfAsC~AoE`O_]lHmLtCyDdHmItDiEbKgIhEkD~@u@`BeAbCwBfPgNrFyGP]nBn@bAZd@NdA\\`Bj@~V~ExDj@',
      },
    ],
    summary: {
      has_time_restrictions: false,
      has_toll: false,
      has_highway: false,
      has_ferry: false,
      min_lat: 52.502431,
      min_lon: 13.361159,
      max_lat: 52.534975,
      max_lon: 13.373645,
      time: 1082.698,
      length: 5.029,
      cost: 2750.902,
    },
    status_message: 'Found route between points',
    status: 0,
    units: 'kilometers',
    language: 'en-US',
  },
  id: 'valhalla_directions',
};

export const mockHeightResponse = {
  shape: [
    {
      lat: 52.517317,
      lon: 13.370447,
    },
  ],
  height: [34],
  id: 'valhalla_height',
};

export const mockLocateResponse = [
  {
    input_lat: 52.51246,
    input_lon: 13.363323,
    edges: [
      {
        way_id: 117116622,
        correlated_lat: 52.512263,
        correlated_lon: 13.363185,
        side_of_street: 'right',
        percent_along: 0.1334,
      },
      {
        way_id: 117116622,
        correlated_lat: 52.512263,
        correlated_lon: 13.363185,
        side_of_street: 'left',
        percent_along: 0.86659,
      },
    ],
    nodes: [],
  },
];

export const mockSearchResponse = [
  {
    place_id: 123456,
    licence: 'Data © OpenStreetMap contributors, ODbL 1.0.',
    osm_type: 'way',
    osm_id: 12345,
    lat: BERLIN_COORDINATES.lat.toString(),
    lon: BERLIN_COORDINATES.lon.toString(),
    class: 'highway',
    type: 'primary',
    place_rank: 26,
    importance: 0.5148900273965856,
    addresstype: 'road',
    name: 'Unter den Linden',
    display_name: 'Unter den Linden, Mitte, Berlin, Germany',
    boundingbox: [
      BERLIN_COORDINATES.bounds.minLat,
      BERLIN_COORDINATES.bounds.maxLat,
      BERLIN_COORDINATES.bounds.minLon,
      BERLIN_COORDINATES.bounds.maxLon,
    ],
  },
];

export async function setupStatusMock(
  page: Page,
  response = mockStatusResponse
) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/valhalla1.openstreetmap.de/status**',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();

      apiRequests.push({
        url,
        method: request.method(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

export async function setupNominatimMock(
  page: Page,
  response = mockNominatimResponse
) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/nominatim.openstreetmap.org/reverse**',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      const urlObj = new URL(url);

      apiRequests.push({
        url,
        method: request.method(),
        params: {
          lon: urlObj.searchParams.get('lon'),
          lat: urlObj.searchParams.get('lat'),
          format: urlObj.searchParams.get('format'),
        },
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

export async function setupRouteMock(page: Page, response = mockRouteResponse) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/valhalla1.openstreetmap.de/route**',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();

      apiRequests.push({
        url,
        method: request.method(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

export async function setupHeightMock(
  page: Page,
  response = mockHeightResponse
) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/valhalla1.openstreetmap.de/height**',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();

      apiRequests.push({
        url,
        method: request.method(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

export async function setupLocateMock(
  page: Page,
  response = mockLocateResponse
) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/valhalla1.openstreetmap.de/locate',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();
      const body = await request.postData();

      apiRequests.push({
        url,
        method: request.method(),
        body: JSON.parse(body || '{}'),
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

export async function setupSearchMock(
  page: Page,
  response = mockSearchResponse
) {
  const apiRequests: ApiRequest[] = [];

  await page.route(
    '**/nominatim.openstreetmap.org/search**',
    async (route: Route) => {
      const request = route.request();
      const url = request.url();

      apiRequests.push({
        url,
        method: request.method(),
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    }
  );

  return apiRequests;
}

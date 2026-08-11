import { describe, it, expect, beforeEach } from 'vitest';

import type { ActiveWaypoint } from '@/components/types';
import {
  createCoordinateAddress,
  defaultWaypoints,
  useDirectionsStore,
} from './directions-store';

const berlin: ActiveWaypoint = {
  title: 'Berlin, Germany',
  displaylnglat: [13.4, 52.5],
  sourcelnglat: [13.4, 52.5],
  key: 0,
  addressindex: 0,
};

const munich: ActiveWaypoint = {
  title: 'Munich, Germany',
  displaylnglat: [11.58, 48.14],
  sourcelnglat: [11.58, 48.14],
  key: 1,
  addressindex: 1,
};

const waypointIds = () =>
  useDirectionsStore.getState().waypoints.map((wp) => wp.id);

describe('directions-store', () => {
  beforeEach(() => {
    useDirectionsStore.setState({ waypoints: [...defaultWaypoints] });
  });

  describe('selectAddress', () => {
    it('records the address and shows its title as the input value', () => {
      useDirectionsStore
        .getState()
        .selectAddress({ index: 0, address: berlin });

      const waypoint = useDirectionsStore.getState().waypoints[0]!;
      expect(waypoint.selectedAddress).toEqual(berlin);
      expect(waypoint.userInput).toBe('Berlin, Germany');
    });

    it('ignores indices that have no waypoint', () => {
      useDirectionsStore
        .getState()
        .selectAddress({ index: 7, address: berlin });

      expect(useDirectionsStore.getState().waypoints).toHaveLength(2);
    });
  });

  describe('receiveGeocodeResults', () => {
    // Regression: a new (or empty) search used to wipe the selection, which
    // dropped the waypoint from the route and from the permalink.
    it('keeps the selected address when new candidates arrive', () => {
      const { selectAddress, receiveGeocodeResults } =
        useDirectionsStore.getState();
      selectAddress({ index: 0, address: berlin });

      receiveGeocodeResults({ index: 0, addresses: [munich] });

      const waypoint = useDirectionsStore.getState().waypoints[0]!;
      expect(waypoint.geocodeResults).toEqual([munich]);
      expect(waypoint.selectedAddress).toEqual(berlin);
      expect(waypoint.userInput).toBe('Berlin, Germany');
    });

    it('keeps the selected address when a search comes back empty', () => {
      const { selectAddress, receiveGeocodeResults } =
        useDirectionsStore.getState();
      selectAddress({ index: 0, address: berlin });

      receiveGeocodeResults({ index: 0, addresses: [] });

      expect(
        useDirectionsStore.getState().waypoints[0]!.selectedAddress
      ).toEqual(berlin);
    });
  });

  describe('waypoint ids', () => {
    // Regression: ids derived from the waypoint count collided after a
    // removal, which gave two rows the same React key.
    it('stays unique when a waypoint is removed and another is added', () => {
      const { addEmptyWaypointToEnd, doRemoveWaypoint } =
        useDirectionsStore.getState();

      addEmptyWaypointToEnd();
      addEmptyWaypointToEnd();
      doRemoveWaypoint({ index: 1 });
      addEmptyWaypointToEnd();

      const ids = waypointIds();
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('doRemoveWaypoint', () => {
    it('clears the last two waypoints in place instead of removing them', () => {
      const { selectAddress, doRemoveWaypoint } = useDirectionsStore.getState();
      selectAddress({ index: 0, address: berlin });

      doRemoveWaypoint({ index: 0 });

      const waypoint = useDirectionsStore.getState().waypoints[0]!;
      expect(useDirectionsStore.getState().waypoints).toHaveLength(2);
      expect(waypoint.selectedAddress).toBeNull();
      expect(waypoint.userInput).toBe('');
    });
  });

  describe('addWaypointAtIndex', () => {
    it('inserts a placeholder that is already routable', () => {
      useDirectionsStore.getState().addWaypointAtIndex({
        index: 1,
        placeholder: { lng: 13.4, lat: 52.5 },
      });

      const waypoint = useDirectionsStore.getState().waypoints[1]!;
      expect(waypoint.selectedAddress).toEqual(
        createCoordinateAddress(13.4, 52.5)
      );
      expect(waypoint.userInput).toBe('13.400000, 52.500000');
    });
  });
});

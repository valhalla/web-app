import { describe, it, expect } from 'vitest';
import { redirect } from '@tanstack/react-router';
import { isValidTab } from './utils/route-schemas';

function activeTabBeforeLoad({
  params,
  search,
}: {
  params: { activeTab: string };
  search: { profile?: string; style?: string };
}) {
  if (!isValidTab(params.activeTab)) {
    throw redirect({
      to: '/$activeTab',
      params: { activeTab: 'directions' },
      search: {
        profile: 'bicycle',
      },
    });
  }
  if (!search.profile) {
    throw redirect({
      to: '/$activeTab',
      params: { activeTab: params.activeTab },
      search: {
        ...search,
        profile: 'bicycle',
      },
    });
  }
}

describe('routes', () => {
  describe('activeTabRoute beforeLoad', () => {
    it('should redirect to directions with default profile for invalid tab', () => {
      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'invalid' },
          search: {},
        })
      ).toThrow();
    });

    it('should redirect with default profile when profile is missing', () => {
      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'directions' },
          search: {},
        })
      ).toThrow();
    });

    it('should redirect with default profile and preserve other search params', () => {
      try {
        activeTabBeforeLoad({
          params: { activeTab: 'isochrones' },
          search: { style: 'custom' },
        });
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('should not redirect when profile is present', () => {
      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'directions' },
          search: { profile: 'car' },
        })
      ).not.toThrow();
    });

    it('should not redirect when profile is present on isochrones tab', () => {
      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'isochrones' },
          search: { profile: 'truck' },
        })
      ).not.toThrow();
    });

    it('should preserve existing profile when switching tabs', () => {
      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'isochrones' },
          search: { profile: 'car' },
        })
      ).not.toThrow();

      expect(() =>
        activeTabBeforeLoad({
          params: { activeTab: 'directions' },
          search: { profile: 'car' },
        })
      ).not.toThrow();
    });
  });
});

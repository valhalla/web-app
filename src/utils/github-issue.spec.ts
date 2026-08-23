import { describe, it, expect, beforeEach } from 'vitest';
import { createGitHubIssueUrl } from './github-issue';

describe('createGitHubIssueUrl', () => {
  beforeEach(() => {
    window.history.pushState(
      {},
      '',
      '/directions?wps=52.5,13.4,52.4,13.3&profile=bicycle'
    );
  });

  it('should generate a default route problem issue URL with window.location.href', () => {
    const issueUrl = createGitHubIssueUrl();
    const parsed = new URL(issueUrl);

    expect(parsed.origin).toBe('https://github.com');
    expect(parsed.pathname).toBe('/valhalla/valhalla/issues/new');
    expect(parsed.searchParams.get('title')).toBe(
      '[Problem report] Route issue'
    );
    expect(parsed.searchParams.get('body')).toContain('### Route URL');
    expect(parsed.searchParams.get('body')).toContain(
      '/directions?wps=52.5,13.4,52.4,13.3&profile=bicycle'
    );
    expect(parsed.searchParams.get('body')).toContain('- **Type**: route');
  });

  it('should generate an isochrone problem issue URL with custom permalinkUrl', () => {
    const issueUrl = createGitHubIssueUrl({
      type: 'isochrone',
      permalinkUrl:
        'https://valhalla.openstreetmap.de/isochrones?wps=52.5,13.4',
      profile: 'pedestrian',
    });
    const parsed = new URL(issueUrl);

    expect(parsed.searchParams.get('title')).toBe(
      '[Problem report] Isochrone issue'
    );
    expect(parsed.searchParams.get('body')).toContain('### Isochrone URL');
    expect(parsed.searchParams.get('body')).toContain(
      'https://valhalla.openstreetmap.de/isochrones?wps=52.5,13.4'
    );
    expect(parsed.searchParams.get('body')).toContain('- **Type**: isochrone');
    expect(parsed.searchParams.get('body')).toContain(
      '- **Profile**: pedestrian'
    );
  });

  it('should include profile in context when provided', () => {
    const issueUrl = createGitHubIssueUrl({
      profile: 'car',
    });
    const parsed = new URL(issueUrl);

    expect(parsed.searchParams.get('body')).toContain('- **Profile**: car');
  });
});

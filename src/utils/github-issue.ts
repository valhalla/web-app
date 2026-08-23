export interface CreateGitHubIssueUrlOptions {
  type?: 'route' | 'isochrone';
  permalinkUrl?: string;
  profile?: string;
}

/**
 * Builds a GitHub issue creation URL for reporting routing or isochrone problems in valhalla/valhalla.
 * Pre-fills the title, problem description template, permalink URL, and active profile context.
 */
export const createGitHubIssueUrl = ({
  type = 'route',
  permalinkUrl,
  profile,
}: CreateGitHubIssueUrlOptions = {}): string => {
  const url =
    permalinkUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const typeLabel = type === 'isochrone' ? 'Isochrone' : 'Route';
  const title = `[Problem report] ${typeLabel} issue`;

  let body = `### Problem Description
<!-- Please describe what is wrong with the ${type} (e.g., detour, wrong turn, access restriction, unexpected travel time) -->


### ${typeLabel} URL
${url}

### Context
- **Type**: ${type}`;

  if (profile) {
    body += `\n- **Profile**: ${profile}`;
  }

  const searchParams = new URLSearchParams({
    title,
    body,
  });

  return `https://github.com/valhalla/valhalla/issues/new?${searchParams.toString()}`;
};

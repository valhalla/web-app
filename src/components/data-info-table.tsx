import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getValhallaUrl, VALHALLA_CLIENT_HEADERS } from '@/utils/valhalla';

const VALHALLA_REPO_URL = 'https://github.com/valhalla/valhalla';

interface ValhallaStatus {
  version: string;
  buildFinished: Date | null;
}

/**
 * Splits a Valhalla version string like `3.8.3-1a53e4e` into its semver and
 * (optional) commit short-SHA. Plain `3.8.3` yields no SHA.
 */
const parseVersion = (version: string) => {
  const [semver, ...rest] = version.split('-');
  return { semver: semver || version, commitSha: rest.join('-') || undefined };
};

/** `2026-08-18 07:17:16 UTC` — the exact instant, timezone-unambiguous. */
const formatUtc = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
  );
};

/**
 * Bottom-of-sidebar key/value table surfacing the served graph's age and the
 * Valhalla version (linking the short-SHA to its commit). Reads the public
 * `/status` endpoint — the only backend metadata the SPA can access.
 */
export const DataInfoTable = () => {
  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['valhallaStatus'],
    queryFn: async (): Promise<ValhallaStatus> => {
      const response = await fetch(`${getValhallaUrl()}/status`, {
        headers: VALHALLA_CLIENT_HEADERS,
      });
      const statusResponse = await response.json();
      return {
        version: statusResponse.version,
        buildFinished: statusResponse.tileset_last_modified
          ? new Date(statusResponse.tileset_last_modified * 1000)
          : null,
      };
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }
  if (isError || !status) {
    return <p className="text-destructive text-sm">Failed to load status</p>;
  }

  const parsedVersion = parseVersion(status.version);

  return (
    <Table data-testid="data-info-table" className="[&_tr]:border-0">
      <TableBody>
        <TableRow>
          <TableCell>Graph age</TableCell>
          <TableCell>
            {status.buildFinished ? (
              <Tooltip>
                <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
                  {formatDistanceToNow(status.buildFinished, {
                    addSuffix: true,
                  })}
                </TooltipTrigger>
                <TooltipContent>
                  {formatUtc(status.buildFinished)}
                </TooltipContent>
              </Tooltip>
            ) : (
              '—'
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Version</TableCell>
          <TableCell className="font-mono">
            {parsedVersion.commitSha ? (
              <a
                href={`${VALHALLA_REPO_URL}/commit/${parsedVersion.commitSha}`}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {parsedVersion.semver}-{parsedVersion.commitSha}
              </a>
            ) : (
              parsedVersion.semver
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

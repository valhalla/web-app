import { downloadFile } from '@/utils/download-file';
import { getDateTimeString } from './date-time';

/**
 * Exports data as a formatted JSON file
 * @param data - The data to export
 * @param fileNamePrefix - The prefix for the filename (e.g., 'valhalla-directions', 'valhalla-isochrones')
 */
export const exportDataAsJson = (
  data: unknown,
  fileNamePrefix: string
): void => {
  const formattedData = JSON.stringify(data, null, 2);
  downloadFile({
    data: formattedData,
    fileName: `${fileNamePrefix}_${getDateTimeString()}.json`,
    fileType: 'text/json',
  });
};

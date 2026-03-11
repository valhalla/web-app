import { toast } from 'sonner';
import type { ValhallaWarning } from '@/components/types';
import type { ExternalToast } from 'sonner';

/**
 * Displays toast notifications for warnings returned by the Valhalla API
 * @param warnings - Optional warnings array from Valhalla API response
 * warning object structure: { code: number, description: string }
 */

const TOAST_CONFIG: ExternalToast = {
  position: 'bottom-center',
  duration: 5000,
  closeButton: true,
};

export const handleValhallaWarnings = (warnings?: ValhallaWarning[]): void => {
  if (!warnings?.length) return;

  warnings?.forEach((warning) => {
    toast.warning('Routing warning', {
      description: warning.description,
      ...TOAST_CONFIG,
    });
  });
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { handleValhallaWarnings } from './handle-valhalla-warnings';

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('handleValhallaWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display toast for each warning', () => {
    const warnings = [
      { code: 1, description: 'Warning one' },
      { code: 2, description: 'Warning two' },
    ];

    handleValhallaWarnings(warnings);

    expect(toast.warning).toHaveBeenCalledTimes(2);
  });

  it('should not display toast when warnings are empty', () => {
    handleValhallaWarnings([]);

    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('should not display toast when warnings are undefined', () => {
    handleValhallaWarnings(undefined);

    expect(toast.warning).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IsochroneCard } from './isochrone-card';
import type { ValhallaIsochroneResponse } from '@/components/types';

const mockToggleShowOnMap = vi.fn();
const mockExportDataAsJson = vi.fn();

vi.mock('@/stores/isochrones-store', () => ({
  useIsochronesStore: vi.fn((selector) =>
    selector({
      toggleShowOnMap: mockToggleShowOnMap,
    })
  ),
}));

vi.mock('@/utils/export', () => ({
  exportDataAsJson: (...args: unknown[]) => mockExportDataAsJson(...args),
}));

const createMockData = (
  features: {
    properties: { contour: number; area: number; type?: string };
  }[] = []
): ValhallaIsochroneResponse => ({
  type: 'FeatureCollection',
  id: 'test-isochrone',
  features: features.map((f) => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [] },
    properties: f.properties,
  })),
});

describe('IsochroneCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    expect(() =>
      render(<IsochroneCard data={data} showOnMap={true} />)
    ).not.toThrow();
  });

  it('should display "No isochrones found" when features array is empty', () => {
    const data = createMockData([]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('No isochrones found')).toBeInTheDocument();
  });

  it('should display "Main Isochrone" header when features exist', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('Main Isochrone')).toBeInTheDocument();
  });

  it('should render show on map switch', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByLabelText('Show on map')).toBeInTheDocument();
  });

  it('should have switch checked when showOnMap is true', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('should have switch unchecked when showOnMap is false', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={false} />);

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('should call toggleShowOnMap when switch is toggled', async () => {
    const user = userEvent.setup();
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith(false);
  });

  it('should display contour value with minutes label', () => {
    const data = createMockData([{ properties: { contour: 15, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('15 minutes')).toBeInTheDocument();
    expect(screen.getByText('Contour')).toBeInTheDocument();
  });

  it('should display area value with km² label for area > 1', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5.678 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('6 km²')).toBeInTheDocument();
    expect(screen.getByText('Area')).toBeInTheDocument();
  });

  it('should display area value with one decimal for area <= 1', () => {
    const data = createMockData([{ properties: { contour: 10, area: 0.456 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('0.5 km²')).toBeInTheDocument();
  });

  it('should render multiple isochrone features', () => {
    const data = createMockData([
      { properties: { contour: 5, area: 2 } },
      { properties: { contour: 10, area: 5 } },
      { properties: { contour: 15, area: 10 } },
    ]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('5 minutes')).toBeInTheDocument();
    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.getByText('15 minutes')).toBeInTheDocument();
  });

  it('should filter out features with type property', () => {
    const data = createMockData([
      { properties: { contour: 10, area: 5 } },
      { properties: { contour: 15, area: 8, type: 'outline' } },
    ]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByText('10 minutes')).toBeInTheDocument();
    expect(screen.queryByText('15 minutes')).not.toBeInTheDocument();
  });

  it('should render Export button', () => {
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should show dropdown menu when Export is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByRole('menuitem', { name: 'JSON' })).toBeInTheDocument();
  });

  it('should call exportDataAsJson when JSON option is clicked', async () => {
    const user = userEvent.setup();
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByRole('menuitem', { name: 'JSON' }));

    expect(mockExportDataAsJson).toHaveBeenCalledWith(
      data,
      'valhalla-directions'
    );
  });

  it('should handle switch toggle to enable show on map', async () => {
    const user = userEvent.setup();
    const data = createMockData([{ properties: { contour: 10, area: 5 } }]);
    render(<IsochroneCard data={data} showOnMap={false} />);

    await user.click(screen.getByRole('switch'));

    expect(mockToggleShowOnMap).toHaveBeenCalledWith(true);
  });

  it('should not render switch when no features', () => {
    const data = createMockData([]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('should not render Export button when no features', () => {
    const data = createMockData([]);
    render(<IsochroneCard data={data} showOnMap={true} />);

    expect(
      screen.queryByRole('button', { name: /export/i })
    ).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeightGraph from './heightgraph';
vi.mock('@/utils/resizable', () => ({
  default: vi.fn(() => ({ destroy: vi.fn() })),
}));

import makeResizable from '@/utils/resizable';

const createMockData = (): Parameters<typeof HeightGraph>[0]['data'] =>
  [
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [13.4, 52.5, 50, 0],
              [13.41, 52.51, 55, 100],
              [13.42, 52.52, 60, 200],
              [13.43, 52.53, 52, 300],
              [13.44, 52.54, 48, 400],
            ],
          },
          properties: {
            attributeType: 1,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [13.44, 52.54, 48, 400],
              [13.45, 52.55, 45, 500],
              [13.46, 52.56, 40, 600],
            ],
          },
          properties: {
            attributeType: -2,
          },
        },
      ],
      properties: {
        summary: 'steepness',
        inclineTotal: 15,
        declineTotal: 20,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

describe('HeightGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render without crashing', () => {
    expect(() =>
      render(<HeightGraph data={createMockData()} width={400} />)
    ).not.toThrow();
  });

  it('should render toggle button', () => {
    render(<HeightGraph data={createMockData()} width={400} />);
    expect(screen.getByTitle('Height Graph')).toBeInTheDocument();
  });

  it('should show expand icon when collapsed', () => {
    render(<HeightGraph data={createMockData()} width={400} />);
    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('should not display chart container when collapsed', () => {
    render(<HeightGraph data={createMockData()} width={400} />);
    const container = document.querySelector('.maplibre-heightgraph');
    expect(container).toHaveStyle({ display: 'none' });
  });

  it('should expand when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} />);

    await user.click(screen.getByTitle('Height Graph'));

    expect(screen.getByText('−')).toBeInTheDocument();
    const container = document.querySelector('.maplibre-heightgraph');
    expect(container).toHaveStyle({ display: 'block' });
  });

  it('should call onExpand callback when expanded', async () => {
    const onExpand = vi.fn();
    const user = userEvent.setup();
    render(
      <HeightGraph data={createMockData()} width={400} onExpand={onExpand} />
    );

    await user.click(screen.getByTitle('Height Graph'));

    expect(onExpand).toHaveBeenCalledWith(true);
  });

  it('should call onExpand callback with false when collapsed', async () => {
    const onExpand = vi.fn();
    const user = userEvent.setup();
    render(
      <HeightGraph data={createMockData()} width={400} onExpand={onExpand} />
    );

    await user.click(screen.getByTitle('Height Graph'));
    await user.click(screen.getByTitle('Height Graph'));

    expect(onExpand).toHaveBeenLastCalledWith(false);
  });

  it('should render SVG when expanded', async () => {
    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} height={200} />);

    await user.click(screen.getByTitle('Height Graph'));

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '400');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('should render legend with steepness colors when expanded', async () => {
    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} />);

    await user.click(screen.getByTitle('Height Graph'));

    expect(screen.getAllByText('16%+').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10-15%').length).toBeGreaterThan(0);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should use default height of 200 when not provided', async () => {
    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} />);

    await user.click(screen.getByTitle('Height Graph'));

    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('should make container resizable when expanded', async () => {
    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} />);

    await user.click(screen.getByTitle('Height Graph'));

    expect(makeResizable).toHaveBeenCalled();
  });

  it('should destroy resizable when collapsed', async () => {
    const destroyMock = vi.fn();
    vi.mocked(makeResizable).mockReturnValue({ destroy: destroyMock });

    const user = userEvent.setup();
    render(<HeightGraph data={createMockData()} width={400} />);

    await user.click(screen.getByTitle('Height Graph'));
    await user.click(screen.getByTitle('Height Graph'));

    expect(destroyMock).toHaveBeenCalled();
  });

  it('should handle empty data gracefully', () => {
    expect(() => render(<HeightGraph data={[]} width={400} />)).not.toThrow();
  });

  it('should handle data with empty features gracefully', () => {
    const emptyData = [
      {
        type: 'FeatureCollection',
        features: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any;
    expect(() =>
      render(<HeightGraph data={emptyData} width={400} />)
    ).not.toThrow();
  });

  it('should update dimensions when width prop changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <HeightGraph data={createMockData()} width={400} />
    );

    await user.click(screen.getByTitle('Height Graph'));

    rerender(<HeightGraph data={createMockData()} width={600} />);

    await waitFor(() => {
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '600');
    });
  });

  it('should pass onHighlight prop to component', async () => {
    const onHighlight = vi.fn();
    const user = userEvent.setup();

    expect(() =>
      render(
        <HeightGraph
          data={createMockData()}
          width={400}
          onHighlight={onHighlight}
        />
      )
    ).not.toThrow();

    await user.click(screen.getByTitle('Height Graph'));

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

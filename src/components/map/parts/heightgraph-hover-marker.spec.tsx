import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeightgraphHoverMarker } from './heightgraph-hover-marker';
import type { FeatureCollection } from 'geojson';

vi.mock('react-map-gl/maplibre', () => ({
  Marker: ({
    longitude,
    latitude,
    children,
  }: {
    longitude: number;
    latitude: number;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="marker"
      data-longitude={longitude}
      data-latitude={latitude}
    >
      {children}
    </div>
  ),
}));

const createHeightgraphData = (
  coordinates: number[][]
): FeatureCollection[] => [
  {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {},
      },
    ],
  },
];

describe('HeightgraphHoverMarker', () => {
  it('should render nothing when hoverDistance is null', () => {
    const { container } = render(
      <HeightgraphHoverMarker
        hoverDistance={null}
        heightgraphData={createHeightgraphData([[0, 0, 100, 0]])}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when heightgraphData is empty', () => {
    const { container } = render(
      <HeightgraphHoverMarker hoverDistance={100} heightgraphData={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when features array is empty', () => {
    const emptyData: FeatureCollection[] = [
      { type: 'FeatureCollection', features: [] },
    ];

    const { container } = render(
      <HeightgraphHoverMarker hoverDistance={100} heightgraphData={emptyData} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render marker at closest coordinate to hoverDistance', () => {
    const coordinates = [
      [10.0, 50.0, 100, 0],
      [10.5, 50.5, 150, 500],
      [11.0, 51.0, 200, 1000],
    ];

    render(
      <HeightgraphHoverMarker
        hoverDistance={500}
        heightgraphData={createHeightgraphData(coordinates)}
      />
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-longitude', '10.5');
    expect(marker).toHaveAttribute('data-latitude', '50.5');
  });

  it('should find closest coordinate when hoverDistance is between points', () => {
    const coordinates = [
      [10.0, 50.0, 100, 0],
      [11.0, 51.0, 200, 1000],
    ];

    render(
      <HeightgraphHoverMarker
        hoverDistance={400}
        heightgraphData={createHeightgraphData(coordinates)}
      />
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-longitude', '10');
    expect(marker).toHaveAttribute('data-latitude', '50');
  });

  it('should find closest coordinate when hoverDistance is closer to second point', () => {
    const coordinates = [
      [10.0, 50.0, 100, 0],
      [11.0, 51.0, 200, 1000],
    ];

    render(
      <HeightgraphHoverMarker
        hoverDistance={600}
        heightgraphData={createHeightgraphData(coordinates)}
      />
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-longitude', '11');
    expect(marker).toHaveAttribute('data-latitude', '51');
  });

  it('should skip coordinates without distance value', () => {
    const coordinates = [
      [10.0, 50.0, 100],
      [11.0, 51.0, 200, 1000],
    ];

    render(
      <HeightgraphHoverMarker
        hoverDistance={500}
        heightgraphData={createHeightgraphData(coordinates)}
      />
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-longitude', '11');
    expect(marker).toHaveAttribute('data-latitude', '51');
  });

  it('should handle hoverDistance of 0', () => {
    const coordinates = [
      [10.0, 50.0, 100, 0],
      [11.0, 51.0, 200, 1000],
    ];

    render(
      <HeightgraphHoverMarker
        hoverDistance={0}
        heightgraphData={createHeightgraphData(coordinates)}
      />
    );

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-longitude', '10');
    expect(marker).toHaveAttribute('data-latitude', '50');
  });
});

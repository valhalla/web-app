import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { colorMappings } from '@/utils/heightgraph';
import makeResizable from '@/utils/resizable';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

interface HeightGraphProps {
  data: FeatureCollection<Geometry, GeoJsonProperties>[];
  width: number;
  height?: number;
  onExpand?: (expanded: boolean) => void;
  onHighlight?: (index: number | null) => void;
}

const HeightGraph: React.FC<HeightGraphProps> = ({
  data,
  width,
  height = 200,
  onExpand,
  onHighlight,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const resizerRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data
    // Coordinates are [lng, lat, elevation, distance]
    interface CoordinateData {
      lng: number;
      lat: number;
      elevation: number;
      distance: number;
      attributeType: number;
    }

    const allCoordinates: CoordinateData[] =
      data[0]?.features.flatMap((f) =>
        (f.geometry as { coordinates: number[][] }).coordinates.map((c) => ({
          lng: c[0] ?? 0,
          lat: c[1] ?? 0,
          elevation: c[2] ?? 0,
          distance: c[3] ?? 0, // Distance from start in meters
          attributeType: (f.properties?.attributeType as number) ?? 0,
        }))
      ) || [];

    if (!allCoordinates || allCoordinates.length === 0) return;

    // Create scales
    const xExtent = d3.extent(allCoordinates, (d) => d.distance) as [
      number,
      number,
    ];
    const yExtent = d3.extent(allCoordinates, (d) => d.elevation) as [
      number,
      number,
    ];

    const xScale = d3.scaleLinear().domain(xExtent).range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0])
      .nice();

    // Draw features with colors
    // Coordinates are [lng, lat, elevation, distance]
    data[0]?.features.forEach((feature) => {
      const coords = (feature.geometry as { coordinates: number[][] })
        .coordinates;
      const attributeType = feature.properties?.attributeType as number;
      const color =
        colorMappings.steepness[
          attributeType.toString() as keyof typeof colorMappings.steepness
        ]?.color || '#cccccc';

      const area = d3
        .area<number[]>()
        .x((d) => xScale(d[3] ?? 0)) // d[3] is distance
        .y0(chartHeight)
        .y1((d) => yScale(d[2] ?? 0)) // d[2] is elevation
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(coords)
        .attr('fill', color)
        .attr('fill-opacity', 0.9)
        .attr('stroke', 'none')
        .attr('d', area);
    });

    // Add axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => `${(+d / 1000).toFixed(1)} km`);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${d} m`);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .attr('class', 'x-axis')
      .style('color', '#666');

    g.append('g').call(yAxis).attr('class', 'y-axis').style('color', '#666');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
      )
      .style('stroke-opacity', 0.1);

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-chartWidth)
          .tickFormat(() => '')
      )
      .style('stroke-opacity', 0.1);

    // Add labels
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Distance from start');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Elevation (m)');

    // Add hover interaction
    const focus = g.append('g').attr('class', 'focus').style('display', 'none');

    focus
      .append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', chartHeight);

    focus.append('circle').attr('r', 5).style('fill', 'blue');

    const tooltip = d3
      .select(containerRef.current)
      .append('div')
      .attr('class', 'heightgraph-tooltip')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-size', '12px')
      .style('z-index', 1000);

    svg
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => {
        focus.style('display', null);
        tooltip.style('opacity', 1);
      })
      .on('mouseout', () => {
        focus.style('display', 'none');
        tooltip.style('opacity', 0);
        if (onHighlight) onHighlight(null);
      })
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const adjustedX = mouseX - margin.left;
        const x0 = xScale.invert(adjustedX);

        // Find closest point
        const bisect = d3.bisector((d: CoordinateData) => d.distance).left;
        const i = bisect(allCoordinates, x0);
        const d0 = allCoordinates[i - 1];
        const d1 = allCoordinates[i];
        const d =
          d0 && d1 ? (x0 - d0.distance > d1.distance - x0 ? d1 : d0) : d0 || d1;

        if (d) {
          focus.attr(
            'transform',
            `translate(${xScale(d.distance)},${yScale(d.elevation)})`
          );
          focus.select('.x-hover-line').attr('x1', 0).attr('x2', 0);

          tooltip
            .style('left', `${mouseX + 10}px`)
            .style('top', `${event.offsetY - 10}px`)
            .html(
              `Distance: ${(d.distance / 1000).toFixed(2)} km<br/>Elevation: ${d.elevation.toFixed(0)} m`
            );

          if (onHighlight) {
            // Pass the distance value instead of index
            // The map component will find the closest point on the route
            onHighlight(d.distance);
          }
        }
      });

    return () => {
      tooltip.remove();
    };
  }, [data, dimensions, onHighlight]);

  const [prevProps, setPrevProps] = useState({ width, height });
  if (prevProps.width !== width || prevProps.height !== height) {
    setPrevProps({ width, height });
    setDimensions({ width, height });
  }

  useEffect(() => {
    if (containerRef.current && isExpanded) {
      resizerRef.current = makeResizable(containerRef.current, {
        handles: 'w, n, nw',
        minWidth: 380,
        minHeight: 140,
        applyInlineSize: false,
        onResize: ({ width, height }) => {
          setDimensions({ width, height });
        },
        onStop: () => {
          // Clear inline styles
          if (containerRef.current) {
            containerRef.current.style.width = '';
            containerRef.current.style.height = '';
            containerRef.current.style.left = '';
            containerRef.current.style.top = '';
          }
        },
      });
    }

    return () => {
      if (
        resizerRef.current &&
        typeof resizerRef.current.destroy === 'function'
      ) {
        resizerRef.current.destroy();
      }
    };
  }, [isExpanded]);

  const handleToggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpand) onExpand(newState);
  };

  return (
    <>
      <div
        className="heightgraph-toggle"
        onClick={handleToggleExpand}
        title="Height Graph"
        style={{
          position: 'absolute',
          bottom: '84px',
          right: '10px',
          width: '36px',
          height: '36px',
          background: 'white',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          zIndex: 1001,
        }}
      >
        {isExpanded ? '−' : '▲'}
      </div>
      <div
        ref={containerRef}
        className={`maplibre-heightgraph ${isExpanded ? 'heightgraph-expanded' : ''}`}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          background: 'white',
          border: '2px solid rgba(0,0,0,0.2)',
          borderRadius: '4px',
          zIndex: 1000,
          display: isExpanded ? 'block' : 'none',
          maxWidth: '95vw',
        }}
      >
        {isExpanded && (
          <div style={{ padding: '10px' }}>
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              style={{ display: 'block' }}
            />
            {/* Legend */}
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '11px',
              }}
            >
              {Object.entries(colorMappings.steepness).map(([key, value]) => (
                <div
                  key={key}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: value.color,
                      border: '1px solid #ccc',
                    }}
                  />
                  <span>{value.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HeightGraph;

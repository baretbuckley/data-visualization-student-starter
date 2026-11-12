import * as d3 from "d3";
import { select } from 'd3-selection';

import type { Config } from "../config";
import type { LineGraphSpace } from "../graphSpace";
import type { LineGraphData, LineToolTip } from "./lineGraph";

export function MultiOpLineGraph(
  svg: SVGSVGElement | null,
  points: { [key: string]: LineGraphData[] },
  graphSpace: LineGraphSpace,
  selectSize: number,
  config: Config,
  setToolTip: (tip: LineToolTip | null) => void,
) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove();

  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const plotWidth = graphSpace.dimensions.width - graphSpace.margin.left - graphSpace.margin.right;
  const plotHeight = graphSpace.dimensions.height - graphSpace.margin.top - graphSpace.margin.bottom;

  const seriesEntries = Object.entries(points);
  const allValues = seriesEntries.flatMap(([, series]) => series);
  const maxAbsY = d3.max(allValues.flatMap((point) => [Math.abs(point.hand), Math.abs(point.auto)])) ?? 1;
  const maxSize = d3.max(allValues, (point) => point.size) ?? 1;
  const minSize = d3.min(allValues, (point) => point.size) ?? 0;

  const xScale = graphSpace.xScale.domain([minSize, maxSize]).range([0, plotWidth]);
  const yScale = graphSpace.yScale.domain([-maxAbsY, maxAbsY]).range([plotHeight, 0]);

  const zeroY = yScale(0);
  const bkgTickColor = config.siteColors.text;
  const bkgGridColor = config.siteColors.surfaceSecondary;

  const getClosestPoint = (size: number) => {
    let minDistance = Infinity;
    let closest: { name: string; point: LineGraphData } | null = null;

    for (const [name, series] of seriesEntries) {
      for (const point of series) {
        const distance = Math.abs(point.size - size);
        if (distance < minDistance) {
          minDistance = distance;
          closest = { name, point };
        }
      }
    }

    return closest;
  };

  graph
    .append('g')
    .selectAll('line.grid')
    .data(yScale.ticks(6))
    .join('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', plotWidth)
    .attr('y1', (d) => yScale(d))
    .attr('y2', (d) => yScale(d))
    .attr('stroke', bkgGridColor)
    .attr('stroke-dasharray', '4 4');

  graph
    .append('line')
    .attr('x1', -10)
    .attr('x2', plotWidth)
    .attr('y1', zeroY)
    .attr('y2', zeroY)
    .attr('stroke', bkgTickColor)
    .attr('stroke-width', 1.5);

  const xAxis = d3
    .axisBottom(xScale)
    .ticks(6)
    .tickFormat((d: d3.NumberValue) => Number(d).toLocaleString());

  const yAxis = d3
    .axisLeft(yScale)
    .ticks(6)
    .tickFormat((d: d3.NumberValue) => `${Math.abs(Number(d)).toFixed(1)}x`);

  graph
    .append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call((g) => xAxis(g))
    .call((g) => g.select('.domain').attr('stroke', bkgTickColor))
    .call((g) => g.selectAll('.tick line').attr('stroke', bkgTickColor))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11).attr('fill', bkgTickColor));

  graph
    .append('g')
    .call((g) => yAxis(g))
    .call((g) => g.select('.domain').attr('stroke', bkgTickColor))
    .call((g) => g.selectAll('.tick line').attr('stroke', bkgTickColor))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11).attr('fill', bkgTickColor));

  graph
    .append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('fill', bkgTickColor)
    .text('Size');

  graph
    .append('text')
    .attr('transform', `translate(${-40}, ${plotHeight / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .attr('fill', bkgTickColor)
    .text('Speedup vs Scalar');

  const colors = [
    config.graphColors.hand,
    config.graphColors.auto,
    config.graphColors.handSel,
    config.graphColors.autoSel,
  ];

  seriesEntries.forEach(([name, series], index) => {
    const handColor = colors[index % colors.length];
    const autoColor = colors[(index + 1) % colors.length];

    const handLine = d3
      .line<{ size: number; hand: number }>()
      .x((d) => xScale(d.size))
      .y((d) => yScale(d.hand))
      .curve(d3.curveMonotoneX);

    const autoLine = d3
      .line<{ size: number; auto: number }>()
      .x((d) => xScale(d.size))
      .y((d) => yScale(d.auto))
      .curve(d3.curveMonotoneX);

    graph
      .append('path')
      .datum(series.map((p) => ({ size: p.size, hand: p.hand })))
      .attr('fill', 'none')
      .attr('stroke', handColor)
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      .attr('d', handLine);

    graph
      .append('path')
      .datum(series.map((p) => ({ size: p.size, auto: p.auto })))
      .attr('fill', 'none')
      .attr('stroke', autoColor)
      .attr('stroke-width', 2)
      .attr('opacity', 0.85)
      .attr('d', autoLine);

    graph
      .append('g')
      .selectAll('circle')
      .data(series)
      .join('circle')
      .attr('cx', (d) => xScale(d.size))
      .attr('cy', (d) => yScale(d.hand))
      .attr('r', 2.5)
      .attr('fill', handColor)
      .attr('opacity', 0.7);

    graph
      .append('g')
      .selectAll('circle.auto')
      .data(series)
      .join('circle')
      .attr('class', 'auto')
      .attr('cx', (d) => xScale(d.size))
      .attr('cy', (d) => yScale(d.auto))
      .attr('r', 2.5)
      .attr('fill', autoColor)
      .attr('opacity', 0.7);

    graph
      .append('text')
      .attr('x', plotWidth - 12)
      .attr('y', 10 + index * 14)
      .attr('text-anchor', 'end')
      .attr('font-size', 10)
      .attr('fill', handColor)
      .text(name);
  });

  graph
    .append('line')
    .attr('x1', xScale(selectSize))
    .attr('x2', xScale(selectSize))
    .attr('y1', yScale.range()[0])
    .attr('y2', yScale.range()[1])
    .attr('stroke', bkgTickColor)
    .attr('stroke-width', 1.5);

  graph
    .append('g')
    .selectAll('rect')
    .data([0])
    .join('rect')
    .attr('y', 0)
    .attr('x', 0)
    .attr('height', plotHeight)
    .attr('width', plotWidth)
    .attr('fill', '#00000000')
    .on('mousemove', (event) => {
      const mouseX = event.clientX - graphSpace.margin.left -250;
      const x = xScale.invert(mouseX);
      const closest = getClosestPoint(x);

      if (!closest) {
        setToolTip(null);
        return;
      }

      setToolTip({
        size: closest.point.size,
        handV: closest.point.hand,
        autoV: closest.point.auto,
      });
    })
    .on('mouseleave', () => setToolTip(null));
}
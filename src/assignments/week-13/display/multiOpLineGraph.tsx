import * as d3 from "d3";
import { select } from 'd3-selection';

import type { Config } from "../config";
import type { LineGraphSpace } from "../graphSpace";
import type { LineGraphData, LineToolTip } from "./lineGraph";


export function nearestOpLine(
  points: { [key: string]: LineGraphData[] },
  px: number,
  py: number,
  x: (hour: number) => number,
  y: (value: number) => number,
  tolerance: number,
) {
  let best: string | null = null;
  let dist = tolerance;
  for (const op of Object.entries(points)) {
    for (let i = 0; i < op[1].length-1; i++) {
      const curr = op[1][i];
      
      const ax = x(curr.size);
      const ayh = y(curr.hand);
      const aya = y(curr.auto);

      const next = op[1][i + 1];
      const bx = x(next.size);
      const byh = y(next.hand);
      const bya = y(next.auto);

      const dx = bx - ax,
            dyh = byh - ayh,
            dya = bya - aya;
      
      const th =
        (dx || dyh)
          ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ayh) * dyh) / (dx * dx + dyh * dyh)))
          : 0;
      const ta =
        (dx || dya)
          ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - aya) * dya) / (dx * dx + dya * dya)))
          : 0;

      const dh = Math.hypot(px - ax - th * dx, py - ayh - th * dyh);
      const da = Math.hypot(px - ax - ta * dx, py - aya - ta * dya);
      if (dh < dist) {
        dist = dh;
        best = op[0];
      }
      if (da < dist) {
        dist = da;
        best = op[0];
      }
    }
  }
  return best;
}


export function MultiOpLineGraph(
  svg: SVGSVGElement | null,
  points: { [key: string]: LineGraphData[] },
  graphSpace: LineGraphSpace,
  selectSize: number,
  selectOp: string|null,
  config: Config,
  onHover: (tip: LineToolTip | null, op:string|null) => void,
  onDblClick?: (operation: string) => void,
) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove();

  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const plotWidth = graphSpace.dimensions.width - graphSpace.margin.left - graphSpace.margin.right;
  const plotHeight = graphSpace.dimensions.height - graphSpace.margin.top - graphSpace.margin.bottom;

  const colors = config.graphColors.multiPallet;

  const seriesEntries = Object.entries(points).map(
    (ent, i) => [
      ent[0], 
      ent[1],
      colors[i % colors.length]
    ] as [string, LineGraphData[], string]
  );

  const xScale = graphSpace.xScale;
  const yScale = graphSpace.yScale;

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

  const getAverageAtSize = (size: number) => {
    const handValues: number[] = [];
    const autoValues: number[] = [];

    for (const [, series] of seriesEntries) {
      let closestPoint: LineGraphData | null = null;
      let minDistance = Infinity;

      for (const point of series) {
        const distance = Math.abs(point.size - size);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      }

      if (closestPoint) {
        handValues.push(closestPoint.hand);
        autoValues.push(closestPoint.auto);
      }
    }

    return {
      handV: d3.mean(handValues) ?? 0,
      autoV: d3.mean(autoValues) ?? 0,
    };
  };

  const getOperationAtSize = (operation: string, size: number) => {
    const series = points[operation];
    if (!series) return null;

    let closestPoint: LineGraphData | null = null;
    let minDistance = Infinity;
    for (const point of series) {
      const distance = Math.abs(point.size - size);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    return closestPoint;
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



  // Move selected to last if select on
  if (selectOp) {
    const found = seriesEntries.find((v) => v[0] == selectOp);
    if (found) {
      const idx = seriesEntries.indexOf(found);
      seriesEntries[idx] = seriesEntries[seriesEntries.length-1];
      seriesEntries[seriesEntries.length-1] = found;
    }
  }

  seriesEntries.forEach(([name, series, color], index) => {

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
      .attr('stroke', color)
      .attr('stroke-width', (selectOp==name)? 3.5 : 2)
      .attr('opacity', (!selectOp)? 0.9 : (selectOp==name)? 1 : 0.2)
      .attr('d', handLine);

    graph
      .append('path')
      .datum(series.map((p) => ({ size: p.size, auto: p.auto })))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', (selectOp==name)? 3.5 : 2)
      .attr('opacity',  (!selectOp)? 0.9 : (selectOp==name)? 1 : 0.2)
      .attr('d', autoLine);

    graph
      .append('g')
      .selectAll('circle')
      .data(series)
      .join('circle')
      .attr('cx', (d) => xScale(d.size))
      .attr('cy', (d) => yScale(d.hand))
      .attr('r', 2.5)
      .attr('fill', color)
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
      .attr('fill', color)
      .attr('opacity', 0.7);

    graph
      .append('text')
      .attr('x', plotWidth - 12)
      .attr('y', 10 + index * 14)
      .attr('text-anchor', 'end')
      .attr('font-size', 10)
      .attr('fill', color)
      .attr('opacity', (!selectOp)? 1 : (selectOp===name)? 1 : 0.5)
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
      const plotNode = graph.node();
      if (!plotNode) return;

      const [mouseX, mouseY] = d3.pointer(event, plotNode);
      const x = xScale.invert(mouseX);
      const closest = getClosestPoint(x);

      const selectOp = nearestOpLine(points, mouseX, mouseY,
        xScale, yScale, 10);

      const average = (!closest) ? null : getAverageAtSize(closest.point.size);
      const operationPoint = (selectOp && closest)
        ? getOperationAtSize(selectOp, closest.point.size)
        : null;

      const toolTip = (!closest || !average) ? null : {
        size: closest.point.size,
        handV: average.handV,
        autoV: average.autoV,
        operationName: operationPoint && selectOp ? selectOp : undefined,
        operationHandV: operationPoint?.hand,
        operationAutoV: operationPoint?.auto,
      };

      onHover(toolTip, selectOp);
    })
    .on('dblclick', (event) => {
      const plotNode = graph.node();
      if (!plotNode || !onDblClick) return;

      const [mouseX, mouseY] = d3.pointer(event, plotNode);
      const operation = nearestOpLine(points, mouseX, mouseY, xScale, yScale, 10);
      if (operation) onDblClick(operation);
    })
    .on('mouseleave', () => onHover(null, null));

}
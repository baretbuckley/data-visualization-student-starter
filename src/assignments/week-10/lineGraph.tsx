import * as d3 from "d3";
import { select } from 'd3-selection';

import * as data from './data';

import type { LineGraphSpace } from "./graphSpace";


export interface LineToolTip {
  size: number,
  handV: number,
  autoV: number,
}

export interface LineGraphData {
  size: number,
  hand: number,
  auto: number,
}

export function LineGraph(svg: SVGSVGElement | null, points: LineGraphData[], graphSpace: LineGraphSpace, selectSize: number, setToolTip: (tip: LineToolTip|null) => void) {
  const svgSel = select(svg);
  svgSel.selectAll('*').remove();

  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  // const aggregateBySize = new Map<number, { hand: number[]; auto: number[] }>();

  // for (const instance of data.data) {
  //   const current = aggregateBySize.get(instance.size) ?? { hand: [], auto: [] };
  //   current.hand.push(instance.result.handVect);
  //   current.auto.push(instance.result.autoVect);
  //   aggregateBySize.set(instance.size, current);
  // }



  const plotWidth = graphSpace.dimensions.width - graphSpace.margin.left - graphSpace.margin.right;
  const plotHeight = graphSpace.dimensions.height - graphSpace.margin.top - graphSpace.margin.bottom;

  const zeroY = graphSpace.yScale(0);


  const getClosestPoint = (size: number) => {
    let minDistance = Infinity;
    let closest: LineGraphData | null = null;

    for (const point of points) {
      const distance = Math.abs(point.size - size);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    return closest;
  };

  // Background grid
  graph
    .append('g')
    .selectAll('line.grid')
    .data(graphSpace.yScale.ticks(6))
    .join('line')
    .attr('class', 'grid')
    .attr('x1', 0)
    .attr('x2', plotWidth)
    .attr('y1', (d) => graphSpace.yScale(d))
    .attr('y2', (d) => graphSpace.yScale(d))
    .attr('stroke', '#d1d5db')
    .attr('stroke-dasharray', '4 4');

  // Zero reference line
  graph
    .append('line')
    .attr('x1', -10)
    .attr('x2', plotWidth)
    .attr('y1', zeroY)
    .attr('y2', zeroY)
    .attr('stroke', '#000000')
    .attr('stroke-width', 1.5);

  const xAxis = d3
    .axisBottom(graphSpace.xScale)
    .ticks(6)
    .tickFormat((d: d3.NumberValue, _index: number) => {
      const value = Number(d);
      return value.toLocaleString();
    });

  const yAxis = d3
    .axisLeft(graphSpace.yScale)
    .ticks(6)
    .tickFormat((d: d3.NumberValue) => {
      const value = Math.abs(Number(d));
      return `${value.toFixed(1)}x`;
    });

  // X axis
  graph
    .append('g')
    .attr('transform', `translate(0, ${graphSpace.yScale.range()[0]})`)
    .call((g) => xAxis(g))
    .call((g) => g.select('.domain').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick line').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11));

  // Y axis
  graph
    .append('g')
    .call((g) => yAxis(g))
    .call((g) => g.select('.domain').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick line').attr('stroke', '#374151'))
    .call((g) => g.selectAll('.tick text').attr('font-size', 11));

  // X-axis label
  graph
    .append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text('Size');

  // Y-axis label
  graph
    .append('text')
    .attr('transform', `translate(${-40}, ${plotHeight / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .attr('font-weight', 'bold')
    .text('Speedup vs Scalar');

  // Positive/negative legend
  graph
    .append('text')
    .attr('x', plotWidth * 0.75)
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('fill', '#da2c2c')
    .text('Hand Vectorized');

  graph
    .append('text')
    .attr('x', plotWidth * 0.75)
    .attr('y', graphSpace.yScale.range()[0]+30)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('fill', '#7c2626')
    .text('Auto Vectorized');

  const handLine = d3
    .line<{ size: number; hand: number }>()
    .x((d) => graphSpace.xScale(d.size))
    .y((d) => graphSpace.yScale(d.hand))
    .curve(d3.curveCardinal);

    // curveMonotoneX

  const autoLine = d3
    .line<{ size: number; auto: number }>()
    .x((d) => graphSpace.xScale(d.size))
    .y((d) => graphSpace.yScale(d.auto))
    .curve(d3.curveMonotoneX);

  graph
    .append('path')
    .datum(points.map((p) => ({ size: p.size, hand: p.hand })))
    .attr('fill', 'none')
    .attr('stroke', '#da2c2c')
    .attr('stroke-width', 2.5)
    .attr('d', handLine);

  graph
    .append('path')
    .datum(points.map((p) => ({ size: p.size, auto: p.auto })))
    .attr('fill', 'none')
    .attr('stroke', '#7c2626')
    .attr('stroke-width', 2.5)
    .attr('d', autoLine);

  // Points
  graph
    .append('g')
    .selectAll('circle.hand-point')
    .data(points)
    .join('circle')
    .attr('class', 'hand-point')
    .attr('cx', (d) => graphSpace.xScale(d.size))
    .attr('cy', (d) => graphSpace.yScale(d.hand))
    .attr('r', 4)
    .attr('fill', '#da2c2c');

  graph
    .append('g')
    .selectAll('circle.auto-point')
    .data(points)
    .join('circle')
    .attr('class', 'auto-point')
    .attr('cx', (d) => graphSpace.xScale(d.size))
    .attr('cy', (d) => graphSpace.yScale(d.auto))
    .attr('r', 4)
    .attr('fill', '#7c2626');

  // Nearest data point tooltip highlight line
  // Zero reference line
  graph
    .append('line')
    .attr('x1', graphSpace.xScale(selectSize))
    .attr('x2', graphSpace.xScale(selectSize))
    .attr('y1', graphSpace.yScale.range()[0])
    .attr('y2', graphSpace.yScale.range()[1])
    .attr('stroke', '#000000')
    .attr('stroke-width', 1.5);


  graph.append('g')
    .selectAll('rect')
    .data([0])
    .join('rect')
    .attr('y',0)
    .attr('x', 0)
    .attr('height', graphSpace.yScale.range()[0] - graphSpace.yScale.range()[1])
    .attr('width', graphSpace.xScale.range()[1] - graphSpace.xScale.range()[0])
    .attr('fill', "#00000000")
    .on('mousemove', (event, _d) => {
      console.log("mouse over");
      console.log("mouse exact: ", event.clientX);
      const mouseX = event.clientX - graphSpace.margin.left - 250;
      const x = graphSpace.xScale.invert(mouseX);

      const closest = getClosestPoint(x);
      console.log("closest", closest);
      
      if (closest === null) setToolTip(null);
      else {
        console.log(mouseX, x, closest.size);
        if (closest.size == selectSize) return;

        setToolTip({
          size: closest.size,
          handV: closest.hand,
          autoV: -closest.auto,
        });
      }
    });
}

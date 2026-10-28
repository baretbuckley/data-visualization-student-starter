import { select } from "d3-selection";
import type { ResultRatio } from "./data";
import type { BarChartSpace } from "./graphSpace";


export type BarChartData = { [cat: string]: ResultRatio};

export interface BarToolTip {
  operation: string;
  result: ResultRatio;
}

export function BarChart(svg: SVGSVGElement | null, data: BarChartData, graphSpace: BarChartSpace, selected: string, onHover?: (toolTip: BarToolTip | null) => void, onDblClick?: (operation: string) => void) {

  const svgSel = select(svg);
  svgSel.selectAll('*').remove();


  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const handVecColor = '#da2c2c';
  const autoVecColor = '#7c2626';
  const handVecColorLight = '#fb4f4f';
  const autoVecColorLight = '#cd5d5d';

  const xticks = graphSpace.xScale.ticks(Math.ceil(graphSpace.xScale.domain()[1] - graphSpace.xScale.domain()[0]));
  const tick_margin = 0.02*(graphSpace.yScale.range()[1] -graphSpace.yScale.range()[0] )
  console.log(graphSpace.xScale.domain()[1], graphSpace.xScale.domain()[0])
  graph.append('g')
    .selectAll('line.grids')
    .data(xticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', (d) => graphSpace.xScale(d))
    .attr('x2', (d) => graphSpace.xScale(d))
    .attr('y1', -tick_margin)
    .attr('y2', graphSpace.dimensions.height-graphSpace.margin.bottom-graphSpace.margin.top+tick_margin)
    .attr('stroke', '#5a5b5c');

  graph
    .selectAll('text.xtick')
    .data(xticks)
    .join('text')
    .attr('class', 'xtick')
    .attr('x', (d) => graphSpace.xScale(d))
    .attr('y', graphSpace.dimensions.height-graphSpace.margin.bottom-graphSpace.margin.top+15)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 12)
    .attr('fill', (d) => (d.valueOf() > 0)? handVecColor : (d.valueOf() < 0)? autoVecColor : '#000000')
    .text((d) => `x${(Math.abs(d)).toLocaleString()}`);


  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', (d) => graphSpace.xScale(-d[1].autoVect))
    .attr('height', graphSpace.yScale.bandwidth())
    .attr('width', (d) => graphSpace.xScale(0) - graphSpace.xScale(-d[1].autoVect))
    .attr('fill', (d) => d[0] === selected ? autoVecColorLight : autoVecColor)
    .attr('stroke', () => (true ? '#111827' : 'transparent'))
    .attr('stroke-width', 2)
    .on('mouseover', (_event, d) => {
      if (onHover) {
        onHover({
          operation: d[0], 
          result: {
            handVect: d[1].handVect,
            autoVect: d[1].autoVect,
          }
        });
      }
    })
    .on('mouseout', () => {
      if (onHover) {
        onHover(null);
      }
    })
    .on('dblclick', (_event, d) => {
      if (onDblClick) {
        onDblClick(d[0]);
      }
    });

  // graph_background(svgSel, graphSpace);
  graph.append('g')
    .selectAll('rect')
    .data(Object.entries(data))
    .join('rect')
    .attr('y', (d) => graphSpace.yScale(d[0]) ?? 0)
    .attr('x', graphSpace.xScale(0))
    .attr('height', graphSpace.yScale.bandwidth())
    // .attr('width', (d) => graphSpace.xScale(graphSpace.xScale.domain()[1]) - graphSpace.xScale(0))
    .attr('width', (d) => graphSpace.xScale(d[1].handVect) - graphSpace.xScale(0))
    .attr('fill', (d) => d[0] === selected ? handVecColorLight : handVecColor)
    .attr('stroke', () => (true ? '#111827' : 'transparent'))
    .attr('stroke-width', 2)
    .on('mouseover', (_event, d) => {
      if (onHover && selected != d[0]) {
        onHover({
          operation: d[0], 
          result: {
            handVect: d[1].handVect,
            autoVect: d[1].autoVect,
          }
        });
      }
    })
    .on('mouseout', () => {
      if (onHover) {
        onHover(null);
      }
    })
    .on('dblclick', (_event, d) => {
      if (onDblClick) {
        onDblClick(d[0]);
      }
    });

  graph
    .selectAll('text.xlabel')
    .data(Object.entries(data))
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', graphSpace.xScale.range()[0] - 40)
    .attr('y', (d) => (graphSpace.yScale(d[0]) ?? 0) + graphSpace.yScale.bandwidth() / 2)
    .attr('font-size', 15)
    .text((d) => d[0])
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[0] * 2 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', autoVecColor)
    .text('Auto Vectorized Speedup');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[1] * 2 + graphSpace.xScale(0)) / 4)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('fill', handVecColor)
    .text('Hand Vectorized Speedup');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[1] + graphSpace.xScale.range()[0]) / 2)
    .attr('y', graphSpace.yScale.range()[1]+40)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .text('Performance Ratio Against Scalarized Version');

}

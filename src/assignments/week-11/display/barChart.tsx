import { select } from "d3-selection";
import type { ResultRatio } from "../data";
import type { BarChartSpace } from "../graphSpace";
import type { Config } from "../config";


export type BarChartData = { [cat: string]: ResultRatio};

export interface BarToolTip {
  operation: string;
  result: ResultRatio;
}

interface SplitLine {
  fullString: string,
  index: number,
  totalLines: number,
  subString: string,
}

function toSplitLine(str: string): SplitLine {
  return {
    fullString: str,
    index: 0,
    totalLines: 1,
    subString: str,
  };
}

function formatName(name: string): SplitLine[] {
  if (name.length < 10) return [toSplitLine(name)];
  const lparen = name.indexOf('(')
  if (lparen == -1) return [toSplitLine(name)];
  return [
    {
      fullString: name,
      index: 0,
      totalLines: 2,
      subString: name.slice(0, lparen),
    },
    {
      fullString: name,
      index: 1,
      totalLines: 2,
      subString: name.slice(lparen),
    }
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const expandedHex = cleanHex.length === 3
    ? cleanHex.split('').map((char) => char + char).join('')
    : cleanHex;

  const value = Number.parseInt(expandedHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BarChart(svg: SVGSVGElement | null, data: BarChartData, graphSpace: BarChartSpace, selected: string, config: Config, onHover?: (toolTip: BarToolTip | null) => void, onDblClick?: (operation: string) => void) {

  const svgSel = select(svg);
  svgSel.selectAll('*').remove();


  const graph = svgSel.append('g').attr('transform', `translate(${graphSpace.margin.left},${graphSpace.margin.top})`);

  const handVecColor = config.graphColors.hand;
  const autoVecColor = config.graphColors.auto;
  const handVecColorLight = config.graphColors.handSel;
  const autoVecColorLight = config.graphColors.autoSel;
  const textColor = config.siteColors.text;

  var numTicks = graphSpace.xScale.domain()[1] - graphSpace.xScale.domain()[0];
  if (numTicks > 20) {
    numTicks /= 5;
  }
  const xticks = graphSpace.xScale.ticks(Math.ceil(numTicks));
  const tick_margin = 0.02*(graphSpace.yScale.range()[1] -graphSpace.yScale.range()[0] )
  const plotHeight = graphSpace.dimensions.height - graphSpace.margin.top - graphSpace.margin.bottom;
  const zeroX = graphSpace.xScale(0);




  graph.append('g')
    .selectAll('line.grids')
    .data(xticks)
    .join('line')
    .attr('class', 'grid')
    .attr('x1', (d) => graphSpace.xScale(d))
    .attr('x2', (d) => graphSpace.xScale(d))
    .attr('y1', -tick_margin)
    .attr('y2', graphSpace.dimensions.height-graphSpace.margin.bottom-graphSpace.margin.top+tick_margin)
    .attr('stroke', textColor);

  graph
    .selectAll('text.xtick')
    .data(xticks)
    .join('text')
    .attr('class', 'xtick')
    .attr('x', (d) => graphSpace.xScale(d))
    .attr('y', -15)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', 12)
    .attr('fill', () => textColor)
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
    .attr('stroke', () => config.siteColors.surfaceSecondary)
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
    .attr('stroke', () => config.siteColors.surfaceSecondary)
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
    .data(Object.entries(data).reduce((prev: SplitLine[], curr: [string, ResultRatio]) => {
      return [...prev, ...formatName(curr[0])]
    }, [] as SplitLine[]))
    .join('text')
    .attr('class', 'xlabel')
    .attr('x', graphSpace.xScale.range()[0] - 40)
    .attr('y', (d) => (graphSpace.yScale(d.fullString) ?? 0) + graphSpace.yScale.bandwidth() / 2 + ((d.totalLines == 2)? -7.5 + 15*d.index : 0))
    .attr('font-size', 15)
    .style('fill', textColor)
    .text((d) => d.subString)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle');

  graph
    .append('text')
    .attr('x', (graphSpace.xScale.range()[0]))
    .attr('y', -30)
    .attr('text-anchor', 'start')
    .attr('font-size', 14)
    .attr('fill', autoVecColor)
    .text('Auto Vectorized Speedup');

  graph
    .append('text')
    .attr('x', graphSpace.xScale.range()[1])
    .attr('y', -30)
    .attr('text-anchor', 'end')
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

  graph.append('line')
    .attr('x1', zeroX)
    .attr('x2', zeroX)
    .attr('y1', 0)
    .attr('y2', plotHeight)
    .attr('stroke', hexToRgba(textColor, 0.28))
    .attr('stroke-width', 9)
    .attr('opacity', 0.45)
    .attr('pointer-events', 'none');

  graph.append('line')
    .attr('x1', zeroX)
    .attr('x2', zeroX)
    .attr('y1', 0)
    .attr('y2', plotHeight)
    .attr('stroke', textColor)
    .attr('stroke-width', 1)
    // .attr('stroke-dasharray', '8 6')
    .attr('pointer-events', 'none');

  const selectedResult = selected && data[selected] ? data[selected] : null;
  if (selectedResult) {
    const handLabelX = graphSpace.xScale(selectedResult.handVect);
    const autoLabelX = graphSpace.xScale(-selectedResult.autoVect);
    const labelY = -42;

    const calloutData = [
      {
        label: `Hand: ${selectedResult.handVect.toFixed(2)}x`,
        x: handLabelX,
        fill: handVecColor,
        anchor: handLabelX > graphSpace.xScale.range()[1] - 40 ? 'end' : 'middle',
      },
      {
        label: `Auto: ${selectedResult.autoVect.toFixed(2)}x`,
        x: autoLabelX,
        fill: autoVecColor,
        anchor: autoLabelX < graphSpace.xScale.range()[0] + 40 ? 'start' : 'middle',
      },
    ];

    const selectedLabelGroup = graph.append('g')
      .attr('pointer-events', 'none');

    // Draw selected op value lines
    selectedLabelGroup
      .selectAll('line.callout-guide-bg')
      .data(calloutData)
      .join('line')
      .attr('class', 'callout-guide-bg')
      .attr('x1', (d) => d.x)
      .attr('x2', (d) => d.x)
      .attr('y1', -18)
      .attr('y2', plotHeight)
      .attr('stroke', (d) => hexToRgba(d.fill, 0.25))
      .attr('stroke-width', 5);
    selectedLabelGroup
      .selectAll('line.callout-guide')
      .data(calloutData)
      .join('line')
      .attr('class', 'callout-guide')
      .attr('x1', (d) => d.x)
      .attr('x2', (d) => d.x)
      .attr('y1', -18)
      .attr('y2', plotHeight)
      .attr('stroke', (_d) => hexToRgba('#FFFFFF', 1))
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4 5');

    // Draw selected op value pill labels
    selectedLabelGroup
      .selectAll('g.callout')
      .data(calloutData)
      .join('g')
      .attr('class', 'callout')
      .attr('transform', (d) => `translate(${d.x}, ${labelY})`)
      .each(function (d) {
        const group = select(this);
        const textNode = group.append('text')
          .attr('fill', d.fill)
          .attr('font-size', 11)
          .attr('font-weight', 700)
          .attr('text-anchor', d.anchor)
          .attr('dominant-baseline', 'middle')
          .attr('paint-order', 'stroke')
          .attr('stroke', config.siteColors.surface)
          .attr('stroke-width', 4)
          .text(d.label);

        const bbox = (textNode.node() as SVGGraphicsElement | null)?.getBBox?.();
        if (!bbox) return;

        const pad = 6;
        const pillWidth = bbox.width + pad * 2;
        const pillHeight = bbox.height + pad * 1.2;
        const pillX = d.anchor === 'middle' ? -pillWidth / 2 : (d.anchor === 'end' ? -pillWidth + pad : -pad);
        // const pillX = -pillWidth / 2 - pad / 2 + 2;
        const pillY = -pillHeight / 2;

        group.insert('rect', 'text')
          .attr('x', pillX)
          .attr('y', pillY)
          .attr('width', pillWidth)
          .attr('height', pillHeight)
          .attr('rx', 7)
          .attr('fill', hexToRgba(config.siteColors.surface, 0.72))
          .attr('stroke', hexToRgba(d.fill, 0.5))
          .attr('stroke-width', 1);
      });
  }

}

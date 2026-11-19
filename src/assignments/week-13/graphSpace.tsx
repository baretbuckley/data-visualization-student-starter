import d3 from "d3";
import { scaleLinear, type ScaleBand, type ScaleLinear } from "d3-scale";
import * as Data from './data';


export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BarChartSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleBand<string>;
}

export interface LineGraphSpace {
  dimensions: Dimensions;
  margin: Margin;
  xScale: ScaleLinear<number, number, never>;
  yScale: ScaleLinear<number, number, never>;
}

export function createLineGraphSpace(dimensions: Dimensions, selectEntry: Data.Entry | null ): LineGraphSpace {
  const margin = { top: 50, right: 5, bottom: 50, left: 60 };
  if (selectEntry === null) {
    const default_scale = scaleLinear()
      .domain([0, 1])
      .range([0, 0]);
    return {
      dimensions: dimensions,
      margin: margin,
      xScale: default_scale,
      yScale: default_scale,
    };
  }
  var handMax = (d3.max(selectEntry.data, (d) => d.result.handVect) ?? 0);
  var autoMax = (d3.max(selectEntry.data, (d) => d.result.autoVect) ?? 0);
  if (autoMax < handMax / 3) {
    autoMax = handMax / 3;
  }
  const yScale = scaleLinear()
    .domain([-(autoMax), (handMax)])
    .range([dimensions.height - margin.top - margin.left, 0]);
  
  var maxSize = (d3.max(selectEntry.data, (d) => d.size) ?? 0);
  var minSize = (d3.min(selectEntry.data, (d) => d.size) ?? 0);

  const xScale = scaleLinear()
    .domain([minSize, maxSize])
    .range([0, dimensions.width - margin.right - margin.left]);

  return {
    dimensions: dimensions,
    margin: margin,
    xScale: xScale,
    yScale: yScale,
  };
}
import type { ScaleBand, ScaleLinear } from "d3-scale";


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

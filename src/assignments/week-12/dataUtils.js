import { ascending, bin, quantileSorted } from 'd3';
import {
  CATEGORIES,
  COMBINED_KEY,
  categoryStyle,
  combinedStyle,
} from './constants.js';

export const numberOrNull = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return null;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};

// Builds the plotted series.
// "separate": one series per sleep-debt category.
// "combined": every observation pooled into a single series.
export const buildSeries = (points, grouping) => {
  if (grouping === 'combined') {
    return [
      {
        key: COMBINED_KEY,
        style: combinedStyle,
        points,
      },
    ];
  }
  return CATEGORIES.map((category) => ({
    key: category,
    style: categoryStyle[category],
    points: points.filter(
      (d) => d.sleep_debt_category === category,
    ),
  }));
};

// Median and middle-50% summary per horizontal bin, computed per series.
// All series share the same bin edges so their trends line up.
export const trendSummary = (
  series,
  xField,
  yField,
  xDomain,
  binCount = 12,
  minN = 15,
) => {
  const binner = bin()
    .value((d) => d[xField])
    .domain(xDomain)
    .thresholds(binCount);

  return series.map((s) => {
    const rows = binner(s.points)
      .filter((b) => b.length >= minN)
      .map((b) => {
        const ys = b.map((d) => d[yField]).sort(ascending);
        return {
          x: (b.x0 + b.x1) / 2,
          x0: b.x0,
          x1: b.x1,
          n: b.length,
          q1: quantileSorted(ys, 0.25),
          median: quantileSorted(ys, 0.5),
          q3: quantileSorted(ys, 0.75),
        };
      });
    return { ...s, rows };
  });
};

// Counts per grid cell for one series. `share` is the fraction of that
// series' observations in the cell, so groups of different sizes
// are comparable.
export const densityGrid = (
  seriesPoints,
  xField,
  yField,
  xDomain,
  yDomain,
  nx,
  ny,
) => {
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  const dx = (xMax - xMin) / nx;
  const dy = (yMax - yMin) / ny;
  const total = seriesPoints.length;
  const counts = new Map();

  seriesPoints.forEach((d) => {
    const ix = Math.min(
      nx - 1,
      Math.max(0, Math.floor((d[xField] - xMin) / dx)),
    );
    const iy = Math.min(
      ny - 1,
      Math.max(0, Math.floor((d[yField] - yMin) / dy)),
    );
    const key = iy * nx + ix;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts].map(([key, count]) => {
    const ix = key % nx;
    const iy = Math.floor(key / nx);
    return {
      ix,
      iy,
      count,
      share: count / total,
      x0: xMin + ix * dx,
      x1: xMin + (ix + 1) * dx,
      y0: yMin + iy * dy,
      y1: yMin + (iy + 1) * dy,
    };
  });
};

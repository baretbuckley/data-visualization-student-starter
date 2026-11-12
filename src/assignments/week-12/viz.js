import { CATEGORIES } from './constants.js';
import { buildSeries } from './dataUtils.js';
import { renderDensityPanels } from './vizDensity.js';
import { renderTrend } from './vizTrend.js';

export const viz = (
  svg,
  {
    data,
    width,
    height,
    xField,
    yField,
    viewMode,
    grouping,
  },
) => {
  svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height);

  const root = svg
    .selectAll('g.plot-root')
    .data([null])
    .join('g')
    .attr('class', 'plot-root');

  root.selectAll('*').remove();

  // Rows without a recognized category or a finite value on both axes are omitted.
  const points = data.filter(
    (d) =>
      Number.isFinite(d[xField]) &&
      Number.isFinite(d[yField]) &&
      CATEGORIES.includes(d.sleep_debt_category),
  );

  const options = {
    points,
    series: buildSeries(points, grouping),
    xField,
    yField,
    width,
    height,
  };

  if (viewMode === 'trend') {
    renderTrend(root, options);
  } else {
    renderDensityPanels(root, options);
  }
};

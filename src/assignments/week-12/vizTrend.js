import {
  area,
  curveMonotoneX,
  line,
  scaleLinear,
  symbol,
} from 'd3';
import { labels } from './constants.js';
import { trendSummary } from './dataUtils.js';
import {
  addAxisTitles,
  buildDomains,
  displayValue,
  drawAxes,
  getTooltip,
  hideTooltip,
  showTooltip,
  tickCount,
} from './plotUtils.js';

const margin = { top: 20, right: 22, bottom: 62, left: 72 };

const markerTooltip = (key, d, xField, yField) =>
  `<strong>${key}</strong><br>` +
  `${labels[xField]} bin: ${displayValue(d.x0)} to ${displayValue(d.x1)}<br>` +
  `Median ${labels[yField]}: ${displayValue(d.median)}<br>` +
  `Middle 50%: ${displayValue(d.q1)} to ${displayValue(d.q3)}<br>` +
  `n = ${d.n}`;

// One plot, one layer per series: median line, IQR band, and a marker per bin.
// Separate mode yields one layer per category; combined mode yields one layer.
export const renderTrend = (
  root,
  { points, series, xField, yField, width, height },
) => {
  const innerW = Math.max(
    1,
    width - margin.left - margin.right,
  );
  const innerH = Math.max(
    1,
    height - margin.top - margin.bottom,
  );

  const { xDomain, yDomain } = buildDomains(
    points,
    xField,
    yField,
  );
  const x = scaleLinear()
    .domain(xDomain)
    .range([0, innerW]);
  const y = scaleLinear()
    .domain(yDomain)
    .range([innerH, 0]);

  const g = root
    .append('g')
    .attr(
      'transform',
      `translate(${margin.left},${margin.top})`,
    );

  drawAxes(g, x, y, innerW, innerH, {
    xTicks: tickCount(innerW, 95),
    yTicks: 5,
  });

  addAxisTitles(g, {
    innerWidth: innerW,
    innerHeight: innerH,
    xLabel: labels[xField] || xField,
    yLabel: labels[yField] || yField,
  });

  const tooltip = getTooltip();
  const summaries = trendSummary(
    series,
    xField,
    yField,
    xDomain,
  );

  const bandGen = area()
    .x((d) => x(d.x))
    .y0((d) => y(d.q1))
    .y1((d) => y(d.q3))
    .curve(curveMonotoneX);

  const lineGen = line()
    .x((d) => x(d.x))
    .y((d) => y(d.median))
    .curve(curveMonotoneX);

  summaries.forEach(({ key, style, rows }) => {
    if (rows.length === 0) return;

    const layer = g
      .append('g')
      .attr('class', 'trend-layer');

    layer
      .append('path')
      .attr('class', 'iqr-band')
      .attr('d', bandGen(rows))
      .attr('fill', style.color)
      .attr('fill-opacity', 0.14)
      .attr('pointer-events', 'none');

    layer
      .append('path')
      .attr('class', 'median-line')
      .attr('d', lineGen(rows))
      .attr('fill', 'none')
      .attr('stroke', style.color)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', style.dash || null)
      .attr('pointer-events', 'none');

    layer
      .selectAll('path.marker')
      .data(rows)
      .join('path')
      .attr('class', 'marker')
      .attr('d', symbol().type(style.symbol).size(80))
      .attr(
        'transform',
        (d) => `translate(${x(d.x)},${y(d.median)})`,
      )
      .attr('fill', style.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('tabindex', 0)
      .attr('role', 'img')
      .attr(
        'aria-label',
        (d) =>
          `${key}: median ${labels[yField]} ${displayValue(d.median)} for ${labels[xField]} ${displayValue(d.x0)} to ${displayValue(d.x1)} (n = ${d.n})`,
      )
      .on('pointerenter pointermove', (event, d) =>
        showTooltip(
          tooltip,
          event,
          markerTooltip(key, d, xField, yField),
        ),
      )
      .on('focus', (event, d) =>
        showTooltip(
          tooltip,
          event,
          markerTooltip(key, d, xField, yField),
        ),
      )
      .on('pointerleave blur', () => hideTooltip(tooltip));
  });
};

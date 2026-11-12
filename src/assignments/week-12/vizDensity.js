import {
  area,
  curveMonotoneX,
  format,
  interpolateRgb,
  line,
  scaleLinear,
} from 'd3';
import { shortLabels } from './constants.js';
import { densityGrid, trendSummary } from './dataUtils.js';
import {
  addAxisTitles,
  buildDomains,
  displayValue,
  drawAxes,
  getTooltip,
  hideTooltip,
  showTooltip,
} from './plotUtils.js';

const GRID = 12;
const GAP = 18;
const INK = '#101828';
const margin = { top: 30, right: 12, bottom: 46, left: 50 };

const cellTooltip = (key, count, d, xField, yField) =>
  `<strong>${key}</strong><br>` +
  `${shortLabels[xField]}: ${displayValue(d.x0)} to ${displayValue(d.x1)}<br>` +
  `${shortLabels[yField]}: ${displayValue(d.y0)} to ${displayValue(d.y1)}<br>` +
  `${format('.1%')(d.share)} of ${key} (${d.count} of ${count})`;

// One panel per series (2 × 2 for separate categories, a single panel when
// combined), on shared scales. Cell shade shows the share of that series'
// observations; the overlay shows the median and IQR.
export const renderDensityPanels = (
  root,
  { points, series, xField, yField, width, height },
) => {
  const cols = series.length > 1 ? 2 : 1;
  const rows = Math.ceil(series.length / cols);
  const panelW = (width - GAP * (cols - 1)) / cols;
  const panelH = (height - GAP * (rows - 1)) / rows;
  const innerW = Math.max(
    1,
    panelW - margin.left - margin.right,
  );
  const innerH = Math.max(
    1,
    panelH - margin.top - margin.bottom,
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

  const summaries = trendSummary(
    series,
    xField,
    yField,
    xDomain,
  );
  const grids = series.map((s) =>
    densityGrid(
      s.points,
      xField,
      yField,
      xDomain,
      yDomain,
      GRID,
      GRID,
    ),
  );

  // One shared maximum so shading means the same thing in every panel.
  const maxShare =
    Math.max(
      0,
      ...grids.flatMap((grid) =>
        grid.map((cell) => cell.share),
      ),
    ) || 1;

  const cellW = innerW / GRID;
  const cellH = innerH / GRID;
  const tooltip = getTooltip();

  const bandGen = area()
    .x((d) => x(d.x))
    .y0((d) => y(d.q1))
    .y1((d) => y(d.q3))
    .curve(curveMonotoneX);

  const lineGen = line()
    .x((d) => x(d.x))
    .y((d) => y(d.median))
    .curve(curveMonotoneX);

  summaries.forEach((s, index) => {
    const { key, style, rows: trendRows } = s;
    const grid = grids[index];
    const col = index % cols;
    const row = Math.floor(index / cols);
    const originX = col * (panelW + GAP);
    const originY = row * (panelH + GAP);
    const count = s.points.length;

    root
      .append('text')
      .attr('class', 'panel-title')
      .attr('x', originX + margin.left)
      .attr('y', originY + 16)
      .attr('fill', style.color)
      .text(`${key} · n = ${count}`);

    const g = root
      .append('g')
      .attr('class', 'panel')
      .attr(
        'transform',
        `translate(${originX + margin.left},${originY + margin.top})`,
      );

    drawAxes(g, x, y, innerW, innerH, {
      xTicks: 4,
      yTicks: 4,
    });

    const ramp = interpolateRgb('#ffffff', style.color);

    g.append('g')
      .attr('class', 'cells')
      .selectAll('rect')
      .data(grid)
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d) => d.ix * cellW)
      .attr('y', (d) => innerH - (d.iy + 1) * cellH)
      .attr('width', cellW)
      .attr('height', cellH)
      .attr('fill', (d) =>
        ramp(Math.sqrt(d.share / maxShare)),
      )
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .on('pointerenter pointermove', (event, d) =>
        showTooltip(
          tooltip,
          event,
          cellTooltip(key, count, d, xField, yField),
        ),
      )
      .on('pointerleave', () => hideTooltip(tooltip));

    if (trendRows.length > 0) {
      g.append('path')
        .attr('class', 'iqr-band')
        .attr('d', bandGen(trendRows))
        .attr('fill', INK)
        .attr('fill-opacity', 0.1)
        .attr('pointer-events', 'none');

      // White halo keeps the median line readable over dark cells.
      g.append('path')
        .attr('class', 'median-halo')
        .attr('d', lineGen(trendRows))
        .attr('fill', 'none')
        .attr('stroke', '#fff')
        .attr('stroke-width', 4)
        .attr('pointer-events', 'none');

      g.append('path')
        .attr('class', 'median-line')
        .attr('d', lineGen(trendRows))
        .attr('fill', 'none')
        .attr('stroke', INK)
        .attr('stroke-width', 1.8)
        .attr('pointer-events', 'none');
    }

    addAxisTitles(g, {
      innerWidth: innerW,
      innerHeight: innerH,
      xLabel: shortLabels[xField] || xField,
      yLabel: shortLabels[yField] || yField,
      small: true,
      offsetX: 36,
      offsetY: 40,
    });
  });
};

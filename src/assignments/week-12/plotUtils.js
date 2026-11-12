import {
  axisBottom,
  axisLeft,
  extent,
  format,
  scaleLinear,
  select,
} from 'd3';

export const displayValue = (value) =>
  Number.isInteger(value)
    ? String(value)
    : format('.2~f')(value);

const paddedDomain = ([min, max]) => {
  if (!Number.isFinite(min) || !Number.isFinite(max))
    return [0, 1];
  if (min === max) {
    const padding = Math.abs(min) * 0.05 || 1;
    return [min - padding, max + padding];
  }
  const padding = (max - min) * 0.04;
  return [min - padding, max + padding];
};

// Nice, shared domains so every view uses the same scale for a given field pair.
export const buildDomains = (points, xField, yField) => ({
  xDomain: scaleLinear()
    .domain(paddedDomain(extent(points, (d) => d[xField])))
    .nice()
    .domain(),
  yDomain: scaleLinear()
    .domain(paddedDomain(extent(points, (d) => d[yField])))
    .nice()
    .domain(),
});

export const tickCount = (size, pixelsPerTick) =>
  Math.max(2, Math.floor(size / pixelsPerTick));

export const drawAxes = (
  g,
  x,
  y,
  innerWidth,
  innerHeight,
  { xTicks, yTicks },
) => {
  g.append('g')
    .attr('class', 'grid')
    .call(
      axisLeft(y)
        .ticks(yTicks)
        .tickSize(-innerWidth)
        .tickFormat(''),
    );

  g.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(axisBottom(x).ticks(xTicks));

  g.append('g')
    .attr('class', 'axis')
    .call(axisLeft(y).ticks(yTicks));
};

export const addAxisTitles = (
  g,
  {
    innerWidth,
    innerHeight,
    xLabel,
    yLabel,
    small = false,
    offsetX = 48,
    offsetY = 53,
  },
) => {
  const className = small
    ? 'axis-label small'
    : 'axis-label';

  g.append('text')
    .attr('class', className)
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + offsetX)
    .attr('text-anchor', 'middle')
    .text(xLabel);

  g.append('text')
    .attr('class', className)
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -offsetY)
    .attr('text-anchor', 'middle')
    .text(yLabel);
};

export const getTooltip = () =>
  select('body')
    .selectAll('.point-tooltip')
    .data([null])
    .join('div')
    .attr('class', 'point-tooltip')
    .attr('role', 'tooltip')
    .style('opacity', 0);

export const showTooltip = (tooltip, event, html) => {
  let left;
  let top;
  if (event.type === 'focus') {
    const rect =
      event.currentTarget.getBoundingClientRect();
    left = rect.right + 8;
    top = rect.top;
  } else {
    left = event.clientX + 12;
    top = event.clientY + 12;
  }
  tooltip
    .style('opacity', 1)
    .html(html)
    .style('left', `${left}px`)
    .style('top', `${top}px`);
};

export const hideTooltip = (tooltip) =>
  tooltip.style('opacity', 0);

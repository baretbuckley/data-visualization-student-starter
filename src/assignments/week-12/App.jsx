import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { csv, select, symbol } from 'd3';
import './styles.css';
import { viz } from './viz.js';
import {
  CATEGORIES,
  COMBINED_KEY,
  categoryStyle,
  combinedStyle,
  numericFields,
  shortLabels,
} from './constants.js';
import { numberOrNull } from './dataUtils.js';

const viewModes = [
  { value: 'panels', label: 'Density panels' },
  { value: 'trend', label: 'Median trend' },
];

const groupingModes = [
  { value: 'separate', label: 'Separate categories' },
  { value: 'combined', label: 'Combined (all categories)' },
];

const hintFor = (viewMode, grouping) => {
  if (viewMode === 'panels') {
    return grouping === 'combined'
      ? 'The panel shows where all observations concentrate: darker cells hold a larger share of observations. The dark line is the median and the shaded band spans the middle 50% of values.'
      : 'Each panel shows where one category’s observations concentrate: darker cells hold a larger share of that category. The dark line is the median and the shaded band spans the middle 50% of values.';
  }
  return grouping === 'combined'
    ? 'The line traces the median of all observations per horizontal bin; the shaded band spans the middle 50%.'
    : 'Each colored line traces the median per horizontal bin; the shaded band spans the middle 50%. Color, marker shape, and line style each identify a category.';
};

const CategoryKey = ({ label, style, count }) => {
  const markerPath = symbol().type(style.symbol).size(60)();
  return (
    <span>
      <svg
        className="key-swatch"
        viewBox="0 0 40 14"
        aria-hidden="true"
        focusable="false"
      >
        <line
          x1="0"
          y1="7"
          x2="40"
          y2="7"
          stroke={style.color}
          strokeWidth="2"
          strokeDasharray={style.dash || undefined}
        />
        <path
          d={markerPath}
          transform="translate(20,7)"
          fill={style.color}
          stroke="#fff"
          strokeWidth="1"
        />
      </svg>
      {label} <span className="count">n = {count}</span>
    </span>
  );
};

export const App = () => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [xField, setXField] = useState(
    'screen_time_before_bed_min',
  );
  const [yField, setYField] = useState(
    'sleep_onset_latency_min',
  );
  const [viewMode, setViewMode] = useState('panels');
  const [grouping, setGrouping] = useState('separate');
  const [error, setError] = useState('');

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          data.filter(
            (d) => d.sleep_debt_category === category,
          ).length,
        ]),
      ),
    [data],
  );

  // Legend entries follow the grouping: one per category, or one pooled entry.
  const legendItems = useMemo(() => {
    if (grouping === 'combined') {
      const total = Object.values(categoryCounts).reduce(
        (sum, n) => sum + n,
        0,
      );
      return [
        {
          key: COMBINED_KEY,
          label: COMBINED_KEY,
          style: combinedStyle,
          count: total,
        },
      ];
    }
    return CATEGORIES.map((category) => ({
      key: category,
      label: category,
      style: categoryStyle[category],
      count: categoryCounts[category],
    }));
  }, [grouping, categoryCounts]);

  useEffect(() => {
    let active = true;

    csv('/sleep_debt_screen_time.csv')
      .then((rows) => {
        if (!active) return;

        const parsed = rows.map((row) => {
          const result = { ...row };
          result.sleep_debt_category = String(
            row.sleep_debt_category ?? '',
          ).trim();
          numericFields.forEach((field) => {
            result[field] = numberOrNull(row[field]);
          });
          return result;
        });

        setData(parsed);
      })
      .catch(() => {
        if (active) {
          setError(
            'The sleep dataset could not be loaded.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const svgNode = svgRef.current;
    if (!container || !svgNode || data.length === 0)
      return undefined;

    const render = () => {
      const { width, height } =
        container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        viz(select(svgNode), {
          data,
          width,
          height,
          xField,
          yField,
          viewMode,
          grouping,
        });
      }
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(container);

    return () => observer.disconnect();
  }, [data, xField, yField, viewMode, grouping]);

  const axisOptions = Object.entries(shortLabels);

  // Tall multi-panel layout only applies when categories are shown separately.
  const chartClass =
    viewMode === 'panels' && grouping === 'separate'
      ? 'chart chart-panels'
      : 'chart';

  return (
    <main className="page">
      <header className="heading">
        <div>
          <p className="eyebrow">Sleep &amp; screen time</p>
          <h1>Late-night screen time and sleep</h1>
          <p className="subtitle">
            Compare sleep-debt categories side by side, or
            combine them to see the overall trend. The plot
            describes associations, not cause and effect.
          </p>
        </div>

        <div
          className="controls"
          aria-label="Chart options"
        >
          <label>
            Horizontal axis
            <select
              value={xField}
              onChange={(event) =>
                setXField(event.target.value)
              }
            >
              {axisOptions.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vertical axis
            <select
              value={yField}
              onChange={(event) =>
                setYField(event.target.value)
              }
            >
              {axisOptions.map(([value, text]) => (
                <option key={value} value={value}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categories
            <select
              value={grouping}
              onChange={(event) =>
                setGrouping(event.target.value)
              }
            >
              {groupingModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            View
            <select
              value={viewMode}
              onChange={(event) =>
                setViewMode(event.target.value)
              }
            >
              {viewModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error ? (
        <p className="message" role="alert">
          {error}
        </p>
      ) : data.length === 0 ? (
        <p className="message" role="status">
          Loading visualization…
        </p>
      ) : (
        <section
          className="chart-shell"
          aria-label="Sleep observations by category"
        >
          <div
            className="legend"
            aria-label="Sleep debt category key"
          >
            {legendItems.map((item) => (
              <CategoryKey
                key={item.key}
                label={item.label}
                style={item.style}
                count={item.count}
              />
            ))}
          </div>
          <div className={chartClass} ref={containerRef}>
            <svg
              ref={svgRef}
              role="img"
              aria-label="Scatterplot summary by sleep debt category"
            />
          </div>
          <p className="hint">
            {hintFor(viewMode, grouping)} Hover or focus an
            element for its values.
          </p>
        </section>
      )}
    </main>
  );
};

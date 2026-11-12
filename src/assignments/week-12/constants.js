import {
  symbolCircle,
  symbolDiamond,
  symbolSquare,
  symbolTriangle,
} from 'd3';

export const CATEGORIES = [
  'No Debt',
  'Mild',
  'Moderate',
  'Severe',
];

// Each category is encoded three ways (color, line dash, marker shape) so it
// can be told apart without relying on color alone.
export const categoryStyle = {
  'No Debt': {
    color: '#287a68',
    dash: '',
    symbol: symbolCircle,
  },
  Mild: {
    color: '#d39124',
    dash: '8 4',
    symbol: symbolSquare,
  },
  Moderate: {
    color: '#c75d3c',
    dash: '2 3',
    symbol: symbolTriangle,
  },
  Severe: {
    color: '#76569a',
    dash: '12 4 2 4',
    symbol: symbolDiamond,
  },
};

// Used when all sleep-debt categories are pooled into a single series.
export const COMBINED_KEY = 'All categories';
export const combinedStyle = {
  color: '#1d2939',
  dash: '',
  symbol: symbolCircle,
};

export const labels = {
  screen_time_before_bed_min:
    'Screen time before bed (minutes)',
  sleep_onset_latency_min: 'Sleep onset latency (minutes)',
  total_sleep_hours: 'Total sleep (hours)',
  sleep_efficiency_pct: 'Sleep efficiency (%)',
  next_day_fatigue_score: 'Next-day fatigue score',
  age: 'Age (years)',
};

export const shortLabels = {
  screen_time_before_bed_min: 'Screen time before bed',
  sleep_onset_latency_min: 'Sleep onset latency',
  total_sleep_hours: 'Total sleep',
  sleep_efficiency_pct: 'Sleep efficiency',
  next_day_fatigue_score: 'Next-day fatigue',
  age: 'Age',
};

export const numericFields = Object.keys(shortLabels);

# Sleep, Screen Time, and Sleep Outcomes

An interactive scatterplot for exploring observations in `sleep_debt_screen_time.csv`. It compares selected numeric fields and colors points by the recorded sleep-debt category. The visualization is descriptive: observed patterns do not establish that one measure causes another.

## Dataset inventory

### `sleep_debt_screen_time.csv`

- **Known size:** 8,500 rows × 23 columns (provided dataset profile).
- **Apparent subject:** Sleep-related measurements, evening screen use, and participant characteristics.
- **Runtime loading:** `/data/sleep_debt_screen_time.csv`, parsed with D3's CSV parser. The CSV header is the first record; parsing uses the header keys exactly as supplied. No preamble or manually split header is assumed.
- **Profile missingness:** The provided profile reports zero missing values for all fields. The application nevertheless treats blank or invalid values in plotted numeric fields as missing and omits those observations from the plot.
- **Profile ranges and means:** Values below are reported by the supplied upload profile, not independently recomputed here.

| Field | Profile / apparent meaning | Munzner classification |
|---|---|---|
| `user_id` | Numeric identifier; profile range 1–1000, 1,000 distinct values. Whether it identifies a person across rows or sessions is not documented. | Nominal identifier (stored as number; not a measure) |
| `age` | Age; profile range 16–65 years. | Quantitative |
| `gender` | Gender category; three distinct values. | Nominal |
| `chronotype` | Chronotype category; three distinct values. | Nominal (possibly ordered only if category definitions establish an order) |
| `occupation` | Occupation category; five distinct values. | Nominal |
| `bedtime_hour` | Bedtime represented numerically; profile range 0.01–24. Interpretation of decimal units, day boundary, and whether values are clock time or elapsed time is not specified. | Quantitative with temporal-like semantics; not safely classifiable as a timestamp |
| `screen_time_before_bed_min` | Minutes of screen use before bed; profile range 6–240. | Quantitative |
| `primary_app_category` | Primary app category; seven distinct values. | Nominal |
| `screen_brightness_pct` | Screen brightness percentage; profile range 9–100. | Quantitative |
| `blue_light_filter_on` | Whether a blue-light filter is on; boolean. | Nominal / Boolean |
| `caffeine_intake_mg` | Caffeine intake in milligrams; profile range 0–500. | Quantitative |
| `caffeine_last_hour` | Numeric measure associated with caffeine and an “hour”; profile range 6–23. The field name and units do not establish whether this means clock hour, time since intake, or another measure. | Quantitative as stored; temporal interpretation uncertain |
| `physical_activity_min` | Physical-activity duration in minutes; profile range 0–180. | Quantitative |
| `room_temperature_f` | Room temperature in degrees Fahrenheit; profile range 59.1–82. | Quantitative |
| `ambient_noise_db` | Ambient noise in decibels; profile range 10–70. | Quantitative |
| `sleep_onset_latency_min` | Sleep-onset latency in minutes; profile range 9.3–63.2. | Quantitative |
| `total_sleep_hours` | Total sleep duration in hours; profile range 4.13–9.33. | Quantitative |
| `rem_sleep_pct` | REM sleep percentage; profile range 7.6–24.8. | Quantitative |
| `deep_sleep_pct` | Deep sleep percentage; profile range 9.8–25.9. | Quantitative |
| `awakenings_count` | Awakening count; profile lists 11 distinct values and range 0–11, but the inferred type is string. Parse/validate as numeric before arithmetic; retain as a count rather than a category if valid. | Quantitative count (stored as string) |
| `sleep_efficiency_pct` | Sleep efficiency percentage; profile range 63.7–95.2. | Quantitative |
| `next_day_fatigue_score` | Next-day fatigue score; profile range 1.61–8.85. Scale endpoints and interpretation are not supplied. | Quantitative score; scale semantics uncertain |
| `sleep_debt_category` | Sleep-debt category; four distinct values. The category labels imply levels, but exact definitions and cutoffs are not supplied. | Ordinal if the category order is verified; otherwise nominal |

### Classification notes

Munzner's data-type framework distinguishes nominal, ordinal, quantitative, temporal, and geographic data. This dataset contains no apparent geographic coordinates or geographic identifiers. `bedtime_hour` and `caffeine_last_hour` are not treated as timestamps because their encoding and reference frame are undocumented. `user_id` is an identifier, not a quantitative magnitude, despite its numeric storage. No dataset-level time variable, repeated-measure key, or participant/session grain is documented.

## Relationships and join caveats

Only one structured dataset is available in the project materials, so no cross-dataset join is currently defensible.

Within the CSV, `user_id` has 1,000 distinct values across 8,500 rows. This suggests repeated identifiers may occur, but does not establish what a row represents, whether IDs refer to stable people, or whether observations are repeated sessions. Do not assume one row per person, aggregate as independent participants, or join `user_id` to another source without checking the other source's key, uniqueness, scope, and grain.

Similarly named or semantically related fields are not evidence of a safe join. No external reference tables, codebooks, or verified mappings are supplied.

## Visualization mappings

- **Type:** Responsive scatterplot.
- **Data:** Rows from `sleep_debt_screen_time.csv`; plotted only when both selected axis values parse as finite numbers.
- **Default horizontal axis:** `screen_time_before_bed_min` (quantitative).
- **Default vertical axis:** `sleep_onset_latency_min` (quantitative).
- **Color:** `sleep_debt_category` (categorical; colors distinguish the observed labels, without asserting verified category thresholds).
- **Point:** One CSV row. Because row grain is undocumented and identifiers may repeat, points should not automatically be interpreted as unique people.
- **Interactions:** Dropdowns switch the quantitative x and y fields. Hover and keyboard focus reveal the recorded category and x/y values. Responsive resizing updates plot dimensions.
- **Rationale:** The default compares an evening behavior with a sleep measure without aggregation or an unverified join. Alternative axes expose other numeric measures available in this single dataset. The display is exploratory and does not imply causal effects.
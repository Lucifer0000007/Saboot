# Real-data validation

**Status: not run.** No real rainfall, river or village data has been put through the harness. Everything the product shows
about detection comes from one synthetic replay, and its precision and recall are a *simulated consistency check, not
validation*. The product's Validation status block says "Not run" until a real report exists.

The harness is built so that a pilot partner, or you, can change that without touching the app: drop in four CSV files, run
one command, and read a report that says what the rules would have detected against what an official process later
confirmed.

## What it does, and what it never does

- It runs the **same rule code** the app uses (`src/sim/rules.ts`: Rule A, rain on low-lying land, and Rule C, river or
  dam), with the same default thresholds, read from the app's scenario file. A report records the rule versions.
- It compares detected villages with villages an official process confirmed as affected or not affected, **at village level**.
- It reads files from `data/real/` (or a folder you name). It **never fetches, scrapes or invents data.** If the folder is
  empty it says so and stops.
- It writes `qa/validation/report.json` and `qa/validation/report.md`, including the size, SHA-256 fingerprint, row count,
  time range, source, licence and retrieval date of every input file.
- It does **not** evaluate Rule B (radar change) because the schema has no radar input. The report says so.
- It does not say anything about evidence quality, claims, eligibility or amounts. It checks whether detection would have
  happened, and when.

## Run it

```text
npm run validate:real                 # reads data/real/, writes qa/validation/
npm run validate:real -- --data some/other/folder
npm run validate:real -- --publish    # a REAL report only: writes public/data/validation-status.json
npm run validate:fixture              # the synthetic fixture under tests/fixtures/validation: proves the harness runs
```

Optional overrides, each recorded in the report: `--rain24`, `--rain-heavy`, `--low-elev-m`, `--max-lag-h`, `--latency-h`,
`--max-station-km` (default 25), `--stale-h` (default 6). Change a threshold only with a stated reason: the defaults are the
app's own scenario parameters, not official levels.

`--publish` refuses a report made from the fixture, a report whose inputs have problems, a report with no scored village,
and any input without provenance. The product then shows the numbers together with the limits and the report fingerprint.

## The fixture

`tests/fixtures/validation/` holds a tiny set of hand-made numbers (a year-2000 date, villages named `Fixture-A` to
`Fixture-F`) that give one true positive, one false alarm, one miss, one true negative, one village with no plot data and one
the rules cannot evaluate. It exists **only to prove the harness runs**. Its provenance file says `_fixture: true`, its
report starts with a banner saying so, `--publish` refuses it, and a unit test checks that nothing under `src/` mentions it.
Its numbers are never displayed in the product.

## Input files

Put these four files and a `PROVENANCE.json` in `data/real/`. Lines that start with `#` are ignored, so a file can say where
it came from. Column order does not matter; extra columns are ignored. All times are full ISO 8601 date-times **with a zone**
(`2026-07-14T08:30:00Z`, or an offset such as `+05:30`; seconds are optional). Anything else is rejected: a time without a
zone is ambiguous, and a date such as `01-02-2026` is not a time. Reports show times in UTC.

**A run refuses to be published if any row was rejected.** The report lists how many rows of each file were rejected (with the
first reason), a missing column, and an unbalanced quote in a CSV (which would otherwise swallow the rest of the file). Fix the
file and run again.

### `rainfall.csv`

| Column | Required | Meaning |
|---|---|---|
| `station_id` | yes | Gauge name, or the id of a satellite grid cell. |
| `lat`, `lon` | yes | Decimal degrees, WGS 84. |
| `time_utc` | yes | The **end** of the interval the depth was measured over. |
| `rain_mm` | yes | Rain depth in millimetres over the interval, 0 or more. |
| `interval_h` | no | Length of the interval in hours, default 1. The whole depth counts from the first whole hour at or after `time_utc`: it is **not** spread back over the interval, because a rule must not fire on hours before the reading existed. A reading at 08:30 counts from 09:00. The interval only says which hours the station reported on. |

A station is used for an event only when, between its first and last hour in the window (the 24 hours before the start, to the
end), at least 90% of the hours were reported. A station with gaps is skipped for that event, because a gap would read as dry
weather and turn a flood into a miss.

### `river.csv`

| Column | Required | Meaning |
|---|---|---|
| `gauge_id` | yes | Gauge name. |
| `lat`, `lon` | yes | Decimal degrees, WGS 84. |
| `kind` | yes | `stage` (river level) or `release` (dam discharge). |
| `unit` | yes | The unit of `value` and `danger_level`, for example `m` or `cumecs`. The same on every row of a gauge. |
| `danger_level` | yes | The danger level in that unit, from the authority that publishes it. The same on every row of a gauge. |
| `time_utc` | yes | When the reading was taken. |
| `value` | yes | The reading. A reading counts for `--stale-h` hours after it was taken. |

### `confirmed.csv`

One row per village per event, from an official process.

| Column | Required | Meaning |
|---|---|---|
| `event_id` | yes | Any label; rows with the same id form one event. |
| `window_start_utc`, `window_end_utc` | yes | The window to run the rules over. The same on every row of an event. Rain from the 24 hours before the start is used. |
| `village` | yes | Must match `plots.csv` exactly. |
| `status` | yes | `affected` or `not_affected`. Villages the process did not label are **unknown**: leave them out, they are not scored. |
| `source` | yes | Which list, order or notification this label comes from. |

### `plots.csv`

| Column | Required | Meaning |
|---|---|---|
| `plot_id` | yes | A khasra or plot number. |
| `village` | yes | The village the plot belongs to. |
| `lat`, `lon` | yes | Decimal degrees. Round them: a village-level comparison does not need the exact field. |
| `area_ha`, `crop` | no | Carried for reference only. |
| `elev_above_river_m` | no | Metres above the river. Below the low-lying line (2.6 m by default) the plot counts as low-lying for Rule A. |
| `low_lying` | no | `1` or `0`. Takes precedence over `elev_above_river_m`. With neither, Rule A **cannot be evaluated** for the plot (it could never fire, which is not the same as no event), so rainfall alone does not make the village evaluable. |
| `river_reach` | no | Gauges upstream of or beside the plot with the hours the flood wave needs to reach it: `GAUGE_ID:2.5;OTHER_ID:6`. Rule C runs only for plots that list a gauge. This needs hydrology knowledge the CSV cannot supply by itself. |

### `PROVENANCE.json`

```json
{
  "_dataset": "A short name for this set of files",
  "rainfall.csv":  { "source": "who published it and where", "licence": "the licence or terms of use", "retrieved": "2026-01-31", "url": "optional", "notes": "optional" },
  "river.csv":     { "source": "...", "licence": "...", "retrieved": "..." },
  "confirmed.csv": { "source": "...", "licence": "...", "retrieved": "..." },
  "plots.csv":     { "source": "...", "licence": "...", "retrieved": "..." }
}
```

`source`, `licence` and `retrieved` are required for every file. Keep the licence text accurate: the report repeats it.
Data you may not redistribute must not be committed: `data/real/*.csv` is git-ignored.

## How the comparison works

For each event, and each labelled village:

1. Each plot takes the nearest rain station within `--max-station-km` that has data, builds an hourly 24-hour rain total and
   runs Rule A with its low-lying flag. If the plot lists river gauges in `river_reach`, Rule C runs on their hourly series.
2. A plot is **detected** when any rule fired (the event clock starts at the earliest qualifying signal, as in the app).
   A village is **detected** when any of its plots is.
3. A village is **not evaluable** when no plot had a rain station in reach and none had gauge data. It is listed and left out
   of the score, rather than counted as a miss.
4. Counts: affected and detected is a true positive, not affected and detected is a false alarm, affected and not detected is
   a miss, not affected and not detected is a true negative. Precision is true positives over detected, recall is true
   positives over affected. A ratio with no denominator is reported as not defined.

## Limits that go with every number

- Village level only. Plot-level truth is not used.
- Rules A and C only. Rule B (radar) is not evaluated.
- Only labelled villages are scored. An official list that is incomplete or late makes a "not affected" label unreliable.
- Thresholds are the app's scenario parameters unless you override them and say why.
- A few villages means wide uncertainty. These are measurements on these files, not a promise for any other flood.
- It measures detection, and when. It does not measure the quality of evidence or any decision.

## Public sources you could download yourself

Saboot has not downloaded, bundled or checked any of these. Each is a **candidate**: check what it covers, its format, and its
licence or terms of use before using it, and record them in `PROVENANCE.json`.

| Need | Candidate source | To check |
|---|---|---|
| Rainfall by gauge or grid | India Meteorological Department station and gridded rainfall {{VERIFY: that IMD publishes station and gridded daily and hourly rainfall for download, in what formats, and under what terms — mausam.imd.gov.in and the IMD data supply portal}} | resolution (hourly or daily), coverage, terms of use |
| Satellite rainfall | ISRO MOSDAC rainfall products {{VERIFY: which rainfall products MOSDAC offers, their time step, and whether registration is needed — mosdac.gov.in}}; NASA GPM IMERG {{VERIFY: IMERG time step, latency and terms — gpm.nasa.gov}}; CHIRPS {{VERIFY: CHIRPS time step and terms — chc.ucsb.edu}} | time step (daily is too coarse for a 24-hour rule), licence |
| River stage | Central Water Commission flood forecasting and India-WRIS {{VERIFY: whether station-wise river stage and its danger levels are downloadable, and under what terms — cwc.gov.in and indiawris.gov.in}} | gauge list, danger levels, time step, terms |
| Dam release | The dam operator and the state irrigation or water resources department {{VERIFY: whether release data is published, by whom, and in what format — the state water resources department}} | availability, format, terms |
| Flood extent (for a later radar rule) | ISRO NRSC Bhuvan flood layers {{VERIFY: which flood inundation layers Bhuvan offers and their terms — bhuvan.nrsc.gov.in}}; Copernicus Emergency Management Service rapid maps {{VERIFY: that CEMS publishes flood delineation maps per activation and their licence — emergency.copernicus.eu}}; Sentinel-1 scenes {{VERIFY: Sentinel-1 access and revisit over the area — dataspace.copernicus.eu}} | coverage of the event, date of capture, licence |
| Confirmed villages | The state's own published assessment lists, for example the lists or orders of a special crop-loss assessment (a girdawari-style process) after a flood {{VERIFY: that the state published village-wise lists for the event and where; Punjab's special girdawari after the 2023 floods is one example — the Punjab revenue department notifications and press releases}} | which villages are named, the date, whether "not affected" villages are listed too |

## Before anyone quotes a number

Read the report's problems list and limits, check that every input has a real source and licence, and say the dataset, the
event, the rules evaluated and the village count next to the number. Never quote the fixture's numbers. Never quote the
simulated consistency check in the product as validation.

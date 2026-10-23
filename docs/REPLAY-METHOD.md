# Replay R-1: the method, fixed before any run

This file is written and committed **before** the validation harness is run on this event. Nothing in it is changed after the
results are seen. If a later change is needed, it is made in a new section marked **tuned**, with the reason, and every number
that depends on it is labelled the same way.

No calendar date is written in this file. Where a time window is needed it is defined from the activation's own record
(below); the dates themselves are provenance and live in `data/replay/README.md` and `data/replay/derived/PROVENANCE.json`.

## 1. The question, and what a result cannot say

**Question.** On one real, past flood, would two of Saboot's rules, as the app codes them, have fired at places that were later
mapped as flooded, and stayed quiet at places that were mapped as dry?

- **Rule A** (heavy rain on low-lying land) and **Rule C** (river or dam level) are evaluated. They are the rules whose inputs
  can be fetched without a login.
- **Rule B** (radar change) is **not evaluated**. The flood extent was itself made from radar images, so scoring a radar rule
  against it would be circular. It is reported as **not independently validated**.
- The result is a **consistency check at coarse scale**, not point-level skill: rain is a 25 km grid cell, river discharge is a
  daily value on a 5 km grid, and the flood extent was mapped at tens of metres. Every point in one rain cell gets the same rain.
  A mapped-dry point in a cell with heavy rain can only be a false alarm by construction.
- **No lead-time claim.** An extent shows where water was, not when an alert could have gone out. The words "alerted hours
  earlier" are not used for this run.
- **No claim about evidence quality, claims, eligibility or amounts.** This run says nothing about them.

## 2. The event and its sources

| Part | Source | Licence and credit |
|---|---|---|
| Flood extent | Copernicus Emergency Management Service rapid mapping, activation **EMSR838** ("Flood in Pakistan", a monsoon flash flood). Public delineation layers, fetched as published | Free, open and free of charge. Credit line: `Copernicus Emergency Management Service (© European Union), EMSR838` plus the product name |
| Rain | Open-Meteo historical weather API, model `era5` (hourly, 0.25 degree grid) | CC BY 4.0, free for non-commercial use. Credit with a link, and "Generated using Copernicus Climate Change Service information" |
| River | Open-Meteo flood API (GloFAS v4, daily discharge in m³/s, 5 km grid), at three points that snap to the Chenab, Ravi and Sutlej | CC BY 4.0 as above. For this period the values come from the archived forecast runs of that product, not from the consolidated reanalysis; the data README says so |

This is the **Pakistan** side of the monsoon of that year. No flood activation involving India exists in the public Copernicus EMS
list. The run says "Replay R-1" and names its source; it is never described as Indian farmers' data.

**Day D** is the date of the activation's recorded `eventTime`, taken from the public activation record saved in
`data/replay/raw/`.

## 3. Points, labels and sampling

**Areas.** The delineation areas of EMSR838 that carry a published flood-extent layer: areas 1, 2, 3, 4, 5, 7 and 8. Area 6 lists
no layer. Areas 9 to 11 are damage grading in another province and are not used.

**Extent used.** For each area, the layer `observedEventA` of its **first delivered product** (`DEL_PRODUCT`), as published.
Every polygon in that layer counts as flooded. Later monitoring products are not used (about 400 MB, and they mix several dates).

**A point** is a latitude and longitude on a regular grid of 0.01 degree (about 1.1 km) inside an area's published outline.

- **affected**: the point is inside a polygon of that area's extent layer.
- **not_affected**: the point is inside the area's outline and **at least 1 km** from every polygon of that layer.
- Points outside the outline are unknown and not used. Points inside the outline but closer than 1 km to an extent edge, and not
  inside it, are dropped (positional error and edge pixels).
- A grid point that lies inside the outlines of **two areas** is dropped: the two layers could disagree about it.

*Clarification added before any harness run, after the extent files were fetched and before any point was sampled: the outlines
of areas 1 and 8 overlap.*

**Sample.** In each area, up to **30 affected** and up to **30 not_affected** points, drawn without replacement from the grid
points of that class, in grid order shuffled by a fixed generator (`mulberry32`, seed `838`). If an area has fewer than 30
of a class, all of them are taken. Nothing else is filtered or chosen by hand. Each sampled point becomes **one plot in its own
"village"** named `R1-A<area>-<number>`, because the harness scores at village level.

## 4. Rain input

For every sampled point, the ERA5 grid cell that Open-Meteo returns for it. One request per distinct cell, hourly
`precipitation` in mm, time zone UTC, from 24 hours before the window to its end. The value stamped H is the rain in the hour
**ending** at H, so it is written with `interval_h = 1` and counts from H. The cell's own grid coordinates, as returned, are the
station position.

## 5. River input

Three points, fixed in advance because a trial request showed they snap to the right river: **(32.325, 73.675) Chenab,
(31.475, 74.125) Ravi, (31.025, 74.525) Sutlej**. Daily `river_discharge`, one value for each day. A daily value is stamped at
the **end** of the day it describes, so it is never used before that day is over; each reading counts for 24 hours (`--stale-h 24`).

**Danger level.** There is no official level for a discharge grid point. The danger level is a **labelled scenario parameter**:
the **90th percentile** of that point's daily discharge over the 90 days that end 30 days before day D. It is computed from those
days only, before the window opens. It is not an official level and is written as such everywhere it is shown.

## 6. Reach and low-lying: two stated assumptions

The app learns "low-lying" and "within reach of a gauge" from a hydrology model the real data does not have. For this replay:

- **Low-lying.** Rule A is evaluated with **every point treated as low-lying**. That is an upper bound on what Rule A could fire
  on, and it is written that way in the results ("Rule A, every point assumed low-lying"). The Rule A + low-lying test of the app
  is therefore not exercised.
- **River reach.** A point is in reach of a river point when it is within **48 km**; the lag is the distance divided by a nominal
  flood-wave speed of **4 km/h** (at most 12 h, the app's own limit). A point farther than that has no reach, and Rule C is not
  evaluated for it.

Both are guesses made here, not facts about the rivers. They are stated so a reader can judge them.

## 7. Parameters

The app's own scenario parameters, unchanged: 64.5 mm in 24 h and 100 mm in 24 h for rain, 12 h longest wave lag, 0.5 h
processing delay. Station reach 25 km. The two additions above (danger level as a 90th percentile; 4 km/h) and `--stale-h 24`.
**Nothing is tuned on this event.**

## 8. Windows

- **Event window**: from **9 days before** day D to **6 days after** it. It contains every observation of the extent layers used.
  Rain from the 24 hours before the window opens is used.
- **Pre-monsoon control window**: the 14 days that start 120 days before day D. Every sampled point is labelled `not_affected`
  for this window. No Copernicus EMS flood activation covers these areas then; that is the evidence for the label, and it is
  evidence that no flood was **mapped**, not proof that none happened. The results call it "assumed quiet".

## 9. Scoring and what is reported

Three runs of the harness on three input folders made from the same points: **Rule A only** (every point low-lying, no river
reach), **Rule C only** (no point low-lying, reach as in section 6) and **both**. Rule B is never run.

For each run the report gives **raw counts**: points caught, missed, false alarms, correct rejections, points the rule could not
be run for, and the number of points; and, so that the effective sample size is visible, the number of **distinct rain cells**
and areas they come from. A ratio is shown only beside its counts. The first time a run produces a fire, `firstFireUtc` is
recorded in the report for reference and is not used in any claim.

The product shows the counts, the source ID, the scale mismatch, "Rule B: not independently validated", the credit lines, and
the assumptions of section 6. It shows no lead time.

## 10. Checks that must pass before the numbers are used

1. The harness runs with network access **blocked** (a preload that makes `fetch` and sockets throw) and gives the same result.
2. `scripts/validation` imports no network module.
3. The same inputs give the same counts byte for byte.
4. A tiny test set marked `_fixture` exercises the pipeline, and its numbers are never shown.
5. The size budgets and the no-third-party-URL gate still pass.
6. The raw files are kept out of git, with a manifest of their address, size and SHA-256 so they can be fetched again and compared.

## 11. Known limits, written down before the run

- Rain at 25 km underestimates intense local storms, and a riverine flood in the plains can come from rain far upstream, where
  the point's own cell was dry. A low Rule A recall would be expected for that reason and is not a fault of the data.
- Radar-derived extents can miss flooded land under dense vegetation or among buildings, so some "not affected" points may have
  been flooded.
- A river point 48 km away says the river was high, not that the water reached the plot. Rule C may fire for every point in
  reach, flooded or not.
- Points in one cell are not independent, and areas along one river are not independent of each other.
- The labels come from one mapping source at the dates of its first delivery.

## 12. Files this run produces

`data/replay/raw/` (not in git): the activation record and the extent layers. `data/replay/derived/`: `rainfall.csv`,
`river.csv`, `plots.csv`, `confirmed.csv`, `PROVENANCE.json`. `data/replay/README.md`: source, licence, credit lines and
retrieval date for each. `scripts/replay/`: the fetch, derive and publish scripts. The run's report is saved with its SHA-256.

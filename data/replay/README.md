# Replay R-1: data and provenance

The method was fixed before any of this was fetched: `docs/REPLAY-METHOD.md`. This folder holds what the run reads and where it
came from. Dates here are provenance fields (retrieval dates and the event period), as the method allows.

## What is where

| Path | In git | What |
|---|---|---|
| `raw/manifest.json` | yes | Every raw file's address, size, SHA-256, server ETag and retrieval time, so the files can be fetched again and compared |
| `raw/emsr838.json`, `raw/extent/AOI*.geojson` | no (about 67 MB) | The public activation record and the flood-extent layers of the first delivered product of areas 1, 2, 3, 4, 5, 7 and 8 |
| `raw/weather/*.json` | no | The Open-Meteo responses, untouched: hourly ERA5 rain per grid cell and window, daily discharge per river point |
| `derived/plots.csv`, `derived/confirmed.csv`, `derived/sample.json` | yes | The 289 sampled points with their labels and the sampling statistics (`scripts/replay/sample.ts`) |
| `derived/rainfall.csv`, `derived/river.csv`, `derived/PROVENANCE.json` | yes | The harness inputs made from the raw responses (`scripts/replay/derive.ts`) |
| `runs/` | no | The three input folders the run assembles (Rule A only, Rule C only, both) |
| `../../qa/replay/` | no | The three reports and `summary.json` (`scripts/replay/run.ts`, run with the network blocked) |

To repeat the run from a fresh clone, in order: `node scripts/replay/fetch-extent.mjs`, then
`node --import ./scripts/ts-resolve.mjs scripts/replay/sample.ts`, `... scripts/replay/fetch-weather.ts`, `... scripts/replay/derive.ts`,
and finally `node --import ./scripts/replay/no-net.mjs --import ./scripts/ts-resolve.mjs scripts/replay/run.ts`. The manifest tells
you whether the sources still serve the same bytes.

## Sources, licences and the credit lines that must travel with the numbers

**Flood extent.** Copernicus Emergency Management Service, rapid mapping activation EMSR838 ("Flood in Pakistan", a monsoon
flash flood; the activation's recorded event time is 29 August 2025). Retrieved 23 October 2026 from
`https://rapidmapping.emergency.copernicus.eu/` (public files, no login). Copernicus EMS products are available on a full, open
and free-of-charge basis. Credit line: **Copernicus Emergency Management Service (© 2025 European Union), EMSR838**, with the
product name (`EMSR838_AOI0n_DEL_PRODUCT_observedEventA_v1`). This is the Pakistan side of that monsoon. No activation covers
India in the public list.

**Rain.** Open-Meteo historical weather API, model `era5` (ECMWF ERA5 reanalysis, 0.25 degree, hourly precipitation),
`https://open-meteo.com/en/docs/historical-weather-api`. Retrieved 23 October 2026. Licence CC BY 4.0
(`https://creativecommons.org/licenses/by/4.0/`), non-commercial use. Credit line: **Weather data by Open-Meteo.com**, and
**Generated using Copernicus Climate Change Service information (2025)**. Changes made: hours re-stamped to the end of the hour
they cover, nothing else.

**River.** Open-Meteo flood API (GloFAS v4 river discharge, about 5 km, daily), `https://open-meteo.com/en/docs/flood-api`.
Retrieved 23 October 2026. Licence CC BY 4.0, non-commercial use. GloFAS is a product of the Copernicus Emergency Management
Service. For this period the values come from the archived forecast runs of the product, not from the consolidated reanalysis.
Changes made: days re-stamped to the end of the day they describe; a danger level added that is **not an official level** (the
90th percentile of the point's own daily discharge over the baseline days named in `derived/river.csv`).

**Points.** Not fields and not farmers: grid points sampled inside the published outlines of the activation. "Low-lying" is
assumed for every point and the river reach is nominal (48 km at 4 km/h). The quiet window is assumed not flooded; nothing
confirms it.

## In the product

The officer console shows the raw counts with the label REPLAY and the source "Replay R-1", the credit lines above, the scale
mismatch, and "Rule B: not independently validated". It shows no lead time and no percentage without its counts.

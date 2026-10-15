// Detection explainer (feature D): updates live with the scrubber. English console view.
// Three deterministic rules own the clock: A (rain on low land), B (radar change), C (river or dam). Every number
// shown is simulated; the limits are stated next to the rules, in plain language.
import '../styles/console.css';
import '../styles/explainer.css';
import { useMemo } from 'preact/hooks';
import { computed } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { Icon } from '../ui/Icon';
import { fmtClock, fmtDur, fmtT } from '../lib/time';
const fmtClockEn = (h: number, withDay = true) => fmtClock(h, withDay, true);
const fmtDurEn = (h: number) => fmtDur(h, true);
import { model, t, tSlow, hour, demoDet } from '../sim/engine';
import { floodPath, floodAreaKm2, lowlandPath, type Model } from '../sim/model';
import { lastPassBefore } from '../sim/evidence';
import { metrics, eventToCall } from '../sim/metrics';
import { rail, cadence } from '../lib/prefs';
import { rows } from '../dashboard/state';

const W = 360, H = 180, PL = 36, PR = 36, PT = 12, PB = 26;
/** Gauges differ by dash pattern as well as tone, so colour is never the only cue. */
const DASH = ['', '6 4', '2 3'];
const TONE = ['#000000', '#4e4d4d', '#242424'];

const cadenceOf = (m: Model) => (m.sar.length > 1 ? m.sar[1] - m.sar[0] : null);

function RainPanel({ m }: { m: Model }) {
  const th = m.raw.thresholds;
  const now = Math.min(m.raw.hours, Math.floor(t.value));
  const x = (h: number) => PL + ((W - PL - PR) * h) / m.raw.hours;
  const y = (mm: number) => H - PB - ((H - PT - PB) * Math.min(mm, 200)) / 200;
  return (
    <section class="xpanel" aria-labelledby="x-rain">
      <h4 id="x-rain"><Icon name="rain" /> Rainfall accumulation vs threshold</h4>
      <svg viewBox={`0 0 ${W} ${H}`} class="xchart" role="img" aria-label={`Trailing 24-hour rainfall at ${m.stations.length} gauges up to ${fmtT(t.value)}. Heavy-rain line ${th.rain24} mm, rain-plus-terrain rule ${th.rainHeavy} mm. Simulated data.`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
          <g key={d}><path d={`M${x(d * 24)} ${PT}V${H - PB}`} stroke="#cecac8" /><text x={x(d * 24)} y={H - 8} class="ax" text-anchor="middle">{d}d</text></g>
        ))}
        {[0, 100, 200].map((v) => <text key={v} x={PL - 6} y={y(v) + 4} class="ax" text-anchor="end">{v}</text>)}
        <path d={`M${PL} ${y(th.rain24)}H${W - PR}`} stroke="#8a5a00" stroke-dasharray="5 3" stroke-width="1.5" />
        <text x={W - PR + 3} y={y(th.rain24) + 4} class="ax">{th.rain24}</text>
        <path d={`M${PL} ${y(th.rainHeavy)}H${W - PR}`} stroke="#b3402a" stroke-dasharray="2 3" stroke-width="1.5" />
        <text x={W - PR + 3} y={y(th.rainHeavy) + 4} class="ax">{th.rainHeavy}</text>
        {m.stations.map((s, i) => {
          let d = '';
          for (let h = 0; h <= now; h++) d += (h ? 'L' : 'M') + x(h).toFixed(1) + ' ' + y(s.r24[h]).toFixed(1);
          return <path key={s.id} d={d} fill="none" stroke={TONE[i]} stroke-width="1.6" stroke-dasharray={DASH[i]} />;
        })}
        <path d={`M${x(t.value)} ${PT}V${H - PB}`} stroke="#000" />
      </svg>
      <ul class="xstations" role="list">
        {m.stations.map((s, i) => {
          let cross: number | null = null;
          for (let h = 0; h <= m.raw.hours; h++) if (s.r24[h] >= th.rain24) { cross = h; break; }
          const v = s.r24[now];
          return (
            <li key={s.id}>
              <svg width="28" height="10" aria-hidden="true"><path d="M1 5h26" stroke={TONE[i]} stroke-width="2" stroke-dasharray={DASH[i]} /></svg>
              <span><strong>{s.id}</strong> {s.name}: <span class="num">{v.toFixed(0)} mm</span></span>
              {cross !== null && cross <= t.value ? <span class="tag tag-warn"><Icon name="halfShape" size={16} />crossed {th.rain24} mm at {fmtT(cross)}</span> : <span class="tag">below line</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Rule C: the river gauges against their danger levels. Synthetic series, made from the same simulated flood. */
function RiverPanel({ m }: { m: Model }) {
  const R = m.raw.river;
  if (!R || !m.gauges.length) return null;
  const now = Math.min(m.raw.hours, Math.floor(t.value));
  const x = (h: number) => PL + ((W - PL - PR) * h) / m.raw.hours;
  const top = Math.max(...m.gauges.flatMap((g) => [g.danger, ...Array.from(g.series)]));
  const maxV = Math.ceil((top * 1.08) / 100) * 100;
  const y = (v: number) => H - PB - ((H - PT - PB) * Math.min(v, maxV)) / maxV;
  const danger = m.gauges[0].danger;
  const unit = m.gauges[0].unit;
  return (
    <section class="xpanel" aria-labelledby="x-river">
      <h4 id="x-river"><Icon name="water" /> River stage vs danger level</h4>
      <svg viewBox={`0 0 ${W} ${H}`} class="xchart" role="img" aria-label={`River stage at ${m.gauges.length} gauges up to ${fmtT(t.value)}. Danger level ${danger} ${unit}. Simulated data.`}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
          <g key={d}><path d={`M${x(d * 24)} ${PT}V${H - PB}`} stroke="#cecac8" /><text x={x(d * 24)} y={H - 8} class="ax" text-anchor="middle">{d}d</text></g>
        ))}
        {[0, maxV / 2, maxV].map((v) => <text key={v} x={PL - 6} y={y(v) + 4} class="ax" text-anchor="end">{v}</text>)}
        <path d={`M${PL} ${y(danger)}H${W - PR}`} stroke="#b3402a" stroke-dasharray="2 3" stroke-width="1.5" />
        <text x={W - PR + 3} y={y(danger) + 4} class="ax">{danger}</text>
        {m.gauges.map((g, i) => {
          let d = '';
          for (let h = 0; h <= now; h++) d += (h ? 'L' : 'M') + x(h).toFixed(1) + ' ' + y(g.series[h]).toFixed(1);
          return <path key={g.id} d={d} fill="none" stroke={TONE[i]} stroke-width="1.6" stroke-dasharray={DASH[i]} />;
        })}
        <path d={`M${x(t.value)} ${PT}V${H - PB}`} stroke="#000" />
      </svg>
      <ul class="xstations" role="list">
        {m.gauges.map((g, i) => {
          let cross: number | null = null;
          for (let h = 0; h < g.series.length; h++) if (g.series[h] >= g.danger) { cross = h; break; }
          return (
            <li key={g.id}>
              <svg width="28" height="10" aria-hidden="true"><path d="M1 5h26" stroke={TONE[i]} stroke-width="2" stroke-dasharray={DASH[i]} /></svg>
              <span><strong>{g.id}</strong> {g.name}: <span class="num">{g.series[now]} {g.unit}</span></span>
              {cross !== null && cross <= t.value ? <span class="tag tag-warn"><Icon name="halfShape" size={16} />danger level at {fmtT(cross)}</span> : <span class="tag">below danger level</span>}
            </li>
          );
        })}
      </ul>
      <p class="muted">
        These gauge series are synthetic and made from the same simulated flood that wets the plots, so Rule C works in this replay by construction. It shows the mechanism, not real-world accuracy.
      </p>
    </section>
  );
}

function MiniMap({ m, children, label }: { m: Model; children: ComponentChildren; label: string }) {
  return (
    <svg class="xmap" viewBox={`0 0 ${m.raw.map.w} ${m.raw.map.h}`} role="img" aria-label={label}>
      <path d={m.raw.map.boundary} fill="#ffffff" stroke="#797776" stroke-width="2" />
      {children}
      <path d={m.raw.map.river} fill="none" stroke="#a0b5eb" stroke-width="9" stroke-linecap="round" />
    </svg>
  );
}

function TerrainPanel({ m }: { m: Model }) {
  const low = useMemo(() => lowlandPath(m), [m]);
  const counts = [0, 0, 0];
  m.plots.forEach((p) => counts[p.terrain]++);
  const reach = m.plots.filter((p) => p.riverReach).length;
  const R = m.raw.river;
  const fill = ['url(#xp-low-plot)', '#ece7e3', '#ffffff'];
  return (
    <section class="xpanel" aria-labelledby="x-ter">
      <h4 id="x-ter"><Icon name="terrain" /> Terrain and river reach</h4>
      <MiniMap m={m} label={`Low-lying land (hatched) and plots by terrain class: ${counts[0]} low-lying, ${counts[1]} mid, ${counts[2]} upland. ${reach} plots are in reach of the river rule. Synthetic terrain.`}>
        <defs>
          <pattern id="xp-low" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><path d="M0 0v6" stroke="#797776" stroke-width="1" /></pattern>
          <pattern id="xp-low-plot" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#cfdaf5" /><path d="M0 0v5" stroke="#242424" stroke-width="1" /></pattern>
        </defs>
        <path d={low} fill="url(#xp-low)" />
        {m.plots.map((p) => <polygon key={p.id} points={p.pts.join(' ')} fill={fill[p.terrain]} stroke={p.riverReach ? '#000' : '#797776'} stroke-width={p.riverReach ? 1.6 : 0.8} />)}
      </MiniMap>
      <p class="muted">
        Plot mean elevation from a synthetic terrain model. <strong>{counts[0]} low-lying</strong> plots (below {m.raw.thresholds.lowElev} m above the river, hatched) qualify for the rain + terrain rule; {counts[1]} mid, {counts[2]} upland.
        {R && <> Bold outlines: <strong>{reach} plots</strong> the river rule can reach (within {R.reachM / 1000} km of the river, or low-lying within {R.lowReachM / 1000} km).</>}
      </p>
    </section>
  );
}

function FloodPanel({ m }: { m: Model }) {
  const h = hour.value;
  const pass = lastPassBefore(m, tSlow.value);
  const truth = useMemo(() => floodPath(m, h), [m, h]);
  const sar = useMemo(() => (pass === null ? '' : floodPath(m, pass)), [m, pass]);
  const area = floodAreaKm2(m, h);
  const sarArea = pass === null ? 0 : floodAreaKm2(m, pass);
  const series = useMemo(() => Array.from({ length: m.raw.hours + 1 }, (_, i) => floodAreaKm2(m, i)), [m]);
  const max = Math.max(...series, 0.01);
  let d = '';
  for (let i = 0; i <= h; i++) d += (i ? 'L' : 'M') + (4 + (i / m.raw.hours) * 352).toFixed(1) + ' ' + (56 - (series[i] / max) * 50).toFixed(1);
  return (
    <section class="xpanel" aria-labelledby="x-fl">
      <h4 id="x-fl"><Icon name="water" /> Flood extent</h4>
      <MiniMap m={m} label={`Simulated true flood ${area.toFixed(2)} square km at ${fmtT(h)}; last simulated radar map ${sarArea.toFixed(2)} square km.`}>
        <path class="xflood" d={truth} fill="#a0b5eb" opacity=".55" />
        <defs><pattern id="xp-sar" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#000" stroke-width="1.4" /></pattern></defs>
        <path d={sar} fill="url(#xp-sar)" opacity=".75" />
        {m.plots.map((p) => <polygon key={p.id} points={p.pts.join(' ')} fill="none" stroke="#797776" stroke-width=".7" />)}
      </MiniMap>
      <svg viewBox="0 0 360 60" class="xspark" aria-hidden="true">
        <path d={d} fill="none" stroke="#242424" stroke-width="1.6" />
        {m.sar.map((s) => <path key={s} d={`M${4 + (s / m.raw.hours) * 352} 56v4`} stroke={s + 1 <= t.value ? '#000' : '#cecac8'} stroke-width="2" />)}
      </svg>
      <p class="muted">
        Light blue = simulated true extent (<strong class="num">{area.toFixed(2)} km²</strong>, grows hour by hour). Black hatching = what Saboot actually sees: the last processed radar pass {pass === null ? '(none yet)' : `at ${fmtT(pass)}, ${sarArea.toFixed(2)} km²`}. Ticks = simulated passes every {cadenceOf(m)} h{cadence.value === 'slow' ? ' (the slower option)' : ' (the demo cadence)'}.
      </p>
    </section>
  );
}

const nowMetrics = computed(() => (model.value ? metrics(model.value, rows.value.map((r) => r.s), tSlow.value) : null));

function AlertPanel({ m }: { m: Model }) {
  const k = nowMetrics.value!;
  const all = eventToCall(m);
  const fd = demoDet.value;
  const latest = rows.value
    .filter((r) => r.s.times.alertT !== null && r.s.times.alertT <= tSlow.value)
    .sort((a, b) => b.s.times.alertT! - a.s.times.alertT!)
    .slice(0, 5);
  const bins = [0, 0, 0, 0, 0, 0];
  k.tta.forEach((v) => bins[Math.min(5, Math.floor(v / 4))]++);
  const bmax = Math.max(1, ...bins);
  const fired = { A: 0, B: 0, C: 0 };
  rows.value.forEach((r) => { if (r.s.times.alertT !== null && r.s.times.alertT <= tSlow.value && r.s.det.detected) r.s.det.fired.forEach((f) => fired[f]++); });
  return (
    <section class="xpanel" aria-labelledby="x-al" data-sim-numbers>
      <h4 id="x-al"><Icon name="phone" /> Alerts sent and time to alert <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated</span></h4>
      <div class="xkpis">
        <div><strong class="num">{k.alerted + k.hailPrompted}</strong><span>alerts and prompts</span></div>
        <div><strong class="num">{k.ttaMedian === null ? '—' : fmtDurEn(k.ttaMedian)}</strong><span>median event to call</span></div>
        <div><strong class="num">{k.ttaP90 === null ? '—' : fmtDurEn(k.ttaP90)}</strong><span>90th percentile</span></div>
      </div>
      <p class="muted">
        The median is the typical farmer: over the whole replay it is <strong class="num">{all.median === null ? '—' : fmtDurEn(all.median)}</strong>.
        {fd && fd.alertT !== null && fd.eventT !== null && <> The demo farmer is called <strong class="num">{fmtDurEn(fd.alertT - fd.eventT)}</strong> after the event began: one plot, not the typical case.</>}
      </p>
      <svg viewBox="0 0 360 96" class="xhist" role="img" aria-label={`Histogram of time to alert, in 4-hour bins: ${bins.join(', ')}. Simulated.`}>
        {bins.map((b, i) => (
          <g key={i}>
            <rect x={10 + i * 58} y={66 - (b / bmax) * 54} width="48" height={(b / bmax) * 54} rx="3" fill="#242424" />
            <text x={34 + i * 58} y={86} class="ax" text-anchor="middle">{i * 4}{i === 5 ? '+' : '–' + (i * 4 + 4)} h</text>
            {b > 0 && <text x={34 + i * 58} y={61 - (b / bmax) * 54} class="ax" text-anchor="middle">{b}</text>}
          </g>
        ))}
      </svg>
      <p class="muted">Alerts by rule (a plot can be counted by more than one): A rain {fired.A} · B radar {fired.B} · C river {fired.C}</p>
      <p class="muted">By language: {Object.entries(k.byLang).map(([l, n]) => `${l.toUpperCase()} ${n}`).join(' · ') || '—'}</p>
      <ul class="xlatest" role="list">
        {latest.map((r) => (
          <li key={r.s.plot.id}>
            <span class="num">{fmtT(r.s.times.alertT!)}</span> {r.s.plot.id} {r.s.plot.village} · {r.s.times.hail ? 'hail prompt' : r.s.det.fired.map((f) => 'rule ' + f).join(' + ')} · {r.s.plot.lang.toUpperCase()} voice
          </li>
        ))}
      </ul>
    </section>
  );
}

function HailPanel({ m }: { m: Model }) {
  const k = nowMetrics.value!;
  const hz = m.raw.hail;
  const on = t.value >= hz.t;
  const st = m.stations[2];
  const relief = rail.value === 'relief';
  return (
    <section class="xpanel" aria-labelledby="x-hail">
      <h4 id="x-hail"><Icon name="hail" /> Hail: a low-confidence prompt path</h4>
      <p>
        The signals in this demo cannot confirm hail damage, and a single gauge spike is not proof. So Saboot does <strong>not</strong> start anyone’s
        clock for hail and never marks hail evidence “Supported”. It asks instead. A prompt nobody answers stays “unconfirmed”: it is not an event, and not a missed window.
      </p>
      <dl class="facts xfacts">
        <div><dt>Signal</dt><dd>{on ? `${st.mm[hz.t].toFixed(0)} mm in 1 h at ${st.id}, ${fmtClockEn(hz.t)}` : 'Not yet (storm at ' + fmtT(hz.t) + ')'}</dd></div>
        <div><dt>Confidence</dt><dd><span class="tag tag-warn"><Icon name="halfShape" size={16} />Low</span></dd></div>
        <div><dt>Prompts sent</dt><dd class="num">{k.hailPrompted}</dd></div>
        <div><dt>“Yes, damage”</dt><dd class="num">{k.hailYes}</dd></div>
      </dl>
      <blockquote class="consent">
        {relief
          ? '“Did hail damage your crop today? Press 1 for yes, 2 for no. If yes, we will ask for three photos, and an officer can review them.”'
          : '“Did hail damage your crop today? Press 1 for yes. If yes, your 72 hours started when the hail fell.”'}
      </blockquote>
    </section>
  );
}

export default function Explainer() {
  const m = model.value!;
  const th = m.raw.thresholds;
  const R = m.raw.river;
  const base = m.raw.baselineWet;
  const cad = cadenceOf(m);
  return (
    <section class="explainer" aria-labelledby="ex-h" data-tour="rules">
      <header class="dash-head">
        <p class="eyebrow">Detection explainer</p>
        <h3 id="ex-h" class="h-sm">How the event was detected</h3>
        <p class="muted">Live with the replay: scrub the timeline and every panel updates. Now <strong class="num">{fmtT(t.value)}</strong> (<span class="num">{fmtClockEn(t.value)}</span> IST).</p>
      </header>
      <div class="card-elev rules">
        <h4><Icon name="scale" /> Deterministic rules own the clock</h4>
        <ol>
          <li><strong>Rule A, rain + terrain:</strong> 24-hour rain at the nearest gauge ≥ <span class="num">{th.rainHeavy}</span> mm <em>and</em> the plot is low-lying. Limit: gauges are sparse, so rain at the gauge is only a proxy for rain on the plot.</li>
          <li>
            <strong>Rule B, radar change:</strong> the plot shows no water at the baseline radar pass, then the water <em>above what the crop shows anyway</em> reaches <span class="num">{Math.round(th.floodFrac * 100)}%</span> of the plot at a later pass.
            {base && <> Dry crops are expected to show none. Paddy in the standing-water season is expected to show about <span class="num">{Math.round(base.frac * 100)}%</span>, so only water on top of that counts, the alert is marked low confidence, and the radar weight in the evidence tier is lowered and its uncertainty widened.</>}
            {/* {{VERIFY: paddy fields are normally flooded on purpose in the kharif transplanting season, so radar change detection cannot separate irrigation water from flood water — UN-SPIDER recommended practice for SAR flood mapping, and the state agriculture department crop calendar}} */}
            {' '}This crop-aware treatment is an unvalidated design decision. Limit: radar passes are infrequent.
          </li>
          <li>
            <strong>Rule C, river or dam:</strong> a river gauge upstream of or beside the plot reaches its danger level{R && <> (<span class="num">{R.gauges[0].danger} {R.gauges[0].unit}</span> in this simulation, a scenario parameter)</>}, and the plot is riverside or low-lying within reach{R && <> (within <span class="num">{R.reachM / 1000}</span> km of the river, or low-lying within <span class="num">{R.lowReachM / 1000}</span> km, and no more than <span class="num">{R.maxLagH}</span> h of flood-wave travel from the gauge)</>}. Limit: it alerts every plot in reach, flooded or not, so it creates false alarms that the farmer’s “no damage” reply closes.
          </li>
          {/* {{VERIFY: IMD classifies 64.5–115.5 mm of rain in 24 hours as "heavy rain" — IMD terminology glossary (mausam.imd.gov.in)}} */}
          <li><strong>Clock start:</strong> the <em>earliest</em> qualifying signal: when 24-hour rain crossed <span class="num">{th.rain24}</span> mm (the threshold IMD uses for “heavy rain”), or the river reached its danger level, or else the last clear radar pass. Never the alert time. If unsure, the farmer gets less time, not more.</li>
        </ol>
        <p>AI is used only for perception (is water visible in a photo?) and language (voice prompts). It never sets a deadline and never decides anything.</p>
      </div>
      <div class="xgrid">
        <RainPanel m={m} />
        <RiverPanel m={m} />
        <FloodPanel m={m} />
        <TerrainPanel m={m} />
        <AlertPanel m={m} />
        <HailPanel m={m} />
        <section class="xpanel" aria-labelledby="x-lim">
          <h4 id="x-lim"><Icon name="info" /> Honest limits</h4>
          <ul class="limits">
            {/* {{VERIFY: C-band SAR under-detects floodwater beneath tall crop canopies such as sugarcane and maize — e.g. UN-SPIDER recommended practice for SAR flood mapping}} */}
            <li>Radar under-sees water beneath tall crops (sugarcane, maize): those plots can be missed by the radar rule, and farmers can still report with a helper.</li>
            {/* {{VERIFY: real satellite radar revisits a field less often than every 12 hours (Sentinel-1: about 6 to 12 days) — ESA Sentinel-1 mission overview}} */}
            <li>This replay assumes a radar pass every {cad} hours (simulated; the slower option is every {m.raw.sarSlow ? m.raw.sarSlow[1] - m.raw.sarSlow[0] : '—'} hours, also simulated). Real revisits are slower, which is why the rain and river rules exist.</li>
            <li>The river gauges and the paddy baseline are synthetic. Rule C works here because the gauge series come from the same simulated flood, so its results show the mechanism and not real-world accuracy.</li>
            <li>The precision and recall shown elsewhere are a consistency check against the simulator’s own truth. They are not a validation, and they must not be quoted as accuracy.</li>
            <li>Rules create false alarms (rain on low land that drained, a river that stayed in its banks). The farmer’s “no damage” reply closes them at no cost.</li>
            <li>Hail is prompt-only and low confidence.</li>
            <li>All terrain, rain, river, radar, farmers and outcomes here are synthetic.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}

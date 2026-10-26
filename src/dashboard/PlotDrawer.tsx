import { useEffect, useMemo, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { fmtClock, fmtDur, fmtT } from '../lib/time';
const fmtClockEn = (h: number, withDay = true) => fmtClock(h, withDay, true);
const fmtDurEn = (h: number) => fmtDur(h, true);
import { sha256, short, checkCode } from '../lib/hash';
import { dbGet } from '../lib/db';
import { openPlot } from '../site/layout';
import { model, tSlow } from '../sim/engine';
import { floodPath } from '../sim/model';
import { stageLabel, flagLabel, type PlotState } from '../sim/cohort';
import { lastPassBefore, bandPct, TIER_RULE, type Evidence } from '../sim/evidence';
import { liveViews, policyNo, SCRIPT } from '../farmer/focus';
import { RELIEF } from '../config';
import { SHOTS } from '../farmer/photo';
import { Thumb } from '../farmer/screens/Capture';
import { rows } from './state';
import { RainChart, RiverChart, SarSpark } from './charts';
import { RowTier } from './PlotList';
import { Pipeline } from './Pipeline';
import { ConsoleNote } from './ConsoleNote';
import { cohortPhotoSvg, svgUrl } from './photos';

interface Ev { t: number; label: string; tone?: 'warn' | 'bad' | 'ok' }

function events(s: PlotState, t: number): Ev[] {
  const tm = s.times;
  const d = s.det;
  const m = model.value!;
  const relief = s.rail === 'relief';
  const hours = m.opts.windowHours;
  const out: Ev[] = [];
  const push = (at: number | null, label: string, tone?: Ev['tone']) => at !== null && at <= t && out.push({ t: at, label, tone });
  if (tm.hail) {
    push(tm.eventT, 'Convective cell with hail signature (radar proxy) — low confidence');
    push(tm.alertT, `Prompt sent: “Did hail damage your crop?” (${s.plot.lang.toUpperCase()} voice)`, 'warn');
  } else {
    const src = d.eventSource;
    push(tm.eventT, src === 'radar-pass' ? 'Event window opens: last clear radar pass (conservative start)'
      : src === 'river' ? `Event begins: ${d.riverGauge} reached its danger level`
      : src === 'rain' ? `Event begins: 24 h rain crossed ${m.raw.thresholds.rain24} mm`
      : 'Event begins at detection');
    push(d.ruleAT, 'Rule A fired: very heavy rain on a low-lying plot', 'warn');
    push(d.ruleBT, s.plot.baselineWet ? 'Rule B fired: simulated radar shows water above the paddy’s standing water (low confidence)' : 'Rule B fired: simulated radar shows the plot submerged vs baseline', 'warn');
    push(d.ruleCT, `Rule C fired: ${d.riverGauge} at its danger level, ${(d.riverLagH ?? 0).toFixed(1)} h of flood-wave travel upstream (${s.plot.riverReach} plot)`, 'warn');
    push(tm.alertT, `Voice alert delivered (${s.plot.lang.toUpperCase()}) · clock already at ${fmtDurEn((tm.alertT ?? 0) - (tm.eventT ?? 0))}`);
  }
  push(tm.noDamageT, 'Farmer replied “no damage” — case closed, logged as false alarm', 'ok');
  push(tm.consentT, 'Helper consent recorded (assisted capture)');
  const late = tm.captureT !== null && tm.deadlineT !== null && tm.captureT > tm.deadlineT;
  push(tm.captureT, `${tm.shots}/3 photos captured on the phone${tm.geoOffM > 100 ? ` · ${tm.geoOffM} m off-plot` : ''}${late && relief ? ' · after the capture-soon advice' : ''}`, late ? (relief ? 'warn' : 'bad') : undefined);
  push(tm.syncT, `Evidence received by the (simulated) server${tm.syncT !== null && tm.captureT !== null && tm.syncT - tm.captureT > 2 ? ` · ${fmtDurEn(tm.syncT - tm.captureT)} after capture (offline queue)` : ''}`, tm.syncT !== null && tm.captureT !== null && tm.syncT - tm.captureT > 2 ? 'warn' : undefined);
  push(tm.fileT, relief ? `Shown to the officer · receipt ${s.ref ?? ''}` : `Reported via official channel · ref ${s.ref ?? ''}`, 'ok');
  if (tm.fileT !== null) {
    if (tm.ackT === null || tm.ackT > tm.fileT + SCRIPT.ackDue) push(tm.fileT + SCRIPT.ackDue, relief ? 'Acknowledgement overdue — officer reminded' : 'Acknowledgement overdue — insurer reminded', 'warn');
    if (tm.ackT === null || tm.ackT > tm.fileT + SCRIPT.escalate) push(tm.fileT + SCRIPT.escalate, relief ? 'Escalated to the district office' : 'Escalated to district agriculture office', 'bad');
  }
  push(tm.ackT, relief ? 'Officer acknowledged; field visit to be scheduled' : 'Insurer acknowledged; inspection to be scheduled', 'ok');
  push(tm.objectionT, 'Farmer attached sealed evidence to the published draft list (objection)', 'warn');
  push(tm.objectionRespT, 'Officer response noted, outside Saboot. Saboot shows that one came, never what it said.', 'ok');
  if (tm.deadlineT !== null && tm.deadlineT <= t && (tm.captureT === null || tm.captureT > tm.deadlineT) && tm.noDamageT === null) {
    push(tm.deadlineT, tm.hail ? 'No reply to the hail prompt: unconfirmed, not an event' : relief ? `Capture-soon advice (${hours} h) ended with no evidence yet` : `${hours} h window closed without evidence`, tm.hail || relief ? 'warn' : 'bad');
  }
  return out.sort((a, b) => a.t - b.t);
}

function Breakdown({ e }: { e: Evidence }) {
  const pct = (x: number) => Math.round(x * 100);
  return (
    <div class="bd">
      <table class="rtable bd-table">
        <caption class="sr-only">Plausibility breakdown</caption>
        <thead>
          <tr><th scope="col">Factor</th><th scope="col">Value</th><th scope="col">Weight</th><th scope="col">Adds</th><th scope="col">±</th></tr>
        </thead>
        <tbody>
          {e.factors.map((f) => (
            <tr key={f.id}>
              <th scope="row">{f.label}<small>{f.detail}</small></th>
              <td data-l="Value"><span class="mbar" style={{ '--v': f.value } as Record<string, number>} aria-hidden="true" /><span class="num">{pct(f.value)}%</span></td>
              <td data-l="Weight" class="num">{f.weight.toFixed(2)}</td>
              <td data-l="Adds" class="num">{(f.weight * f.value * 100).toFixed(0)}</td>
              <td data-l="±" class="num">{(f.weight * f.unc * 100).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row">Plausibility score</th><td colSpan={4} data-l="Score"><strong class="num">{pct(e.score)}</strong> (90% band <span class="num">{bandPct(e.lo)}–{bandPct(e.hi)}</span>)</td></tr>
        </tfoot>
      </table>
      <div class="band" role="img" aria-label={`Score band ${bandPct(e.lo)} to ${bandPct(e.hi)}. Supported if the whole band is at or above ${pct(TIER_RULE.supportedLo)}; insufficient if it is all below ${pct(TIER_RULE.insufficientHi)}.`}>
        <i class="band-ins" style={{ width: `${TIER_RULE.insufficientHi * 100}%` }} />
        <i class="band-sup" style={{ left: `${TIER_RULE.supportedLo * 100}%` }} />
        <b style={{ left: `${e.lo * 100}%`, width: `${Math.max(1, (e.hi - e.lo) * 100)}%` }} />
        <em style={{ left: `${e.score * 100}%` }} />
      </div>
      <p class="band-key">Insufficient &lt; {pct(TIER_RULE.insufficientHi)} · Partial · Supported ≥ {pct(TIER_RULE.supportedLo)} (whole band must clear the line)</p>
    </div>
  );
}

function Photos({ s }: { s: PlotState }) {
  // a plot with a live device log (the demo farmer, or a farmer a helper captured for) shows its real photos
  const lv = liveViews(tSlow.value);
  const focus = s.persona === 'focus' ? lv.focus : lv.live[s.plot.id] ?? null;
  const isFocus = focus !== null;
  const [ver, setVer] = useState<Record<string, boolean | null>>({});
  const items = useMemo(() => {
    if (isFocus) return SHOTS.filter((k) => focus!.shots[k]).map((k) => ({ kind: k, sha: focus!.shots[k]!.sha, id: focus!.shots[k]!.photoId, svg: null as string | null }));
    if (!s.shotsNow) return [];
    return SHOTS.slice(0, s.times.shots).map((k) => ({ kind: k, sha: '', id: '', svg: cohortPhotoSvg(s.plot, k, s.times.geoOffM > 100) }));
  }, [s.plot.id, s.shotsNow, isFocus && focus!.shotCount]);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const v: Record<string, boolean | null> = {}, h: Record<string, string> = {};
      for (const it of items) {
        if (it.svg) { h[it.kind] = await sha256(it.svg); v[it.kind] = true; continue; }
        const blob = await dbGet<Blob>('photos', it.id);
        if (!blob) { v[it.kind] = null; continue; }
        h[it.kind] = await sha256(blob);
        v[it.kind] = h[it.kind] === it.sha;
      }
      if (alive) { setVer(v); setHashes(h); }
    })();
    return () => { alive = false; };
  }, [items]);
  if (!items.length) return <p class="muted">No photos received yet.</p>;
  return (
    <>
    {focus?.seal && <p class="muted" data-check-code>The farmer’s check code, from the sealed packet’s fingerprint: <strong class="num">{checkCode(focus.seal.packetHash)}</strong>. It helps match a phone call to this record; the fingerprint is the proof.</p>}
    <ul class="dphotos" role="list">
      {items.map((it) => (
        <li key={it.kind}>
          {it.svg ? <img src={svgUrl(it.svg)} alt={`Synthetic ${it.kind} view of ${s.plot.id}`} width="160" height="120" /> : <Thumb id={it.id} alt={`${it.kind} shot from the farmer app`} />}
          <span class="cap">{it.kind}</span>
          <span class="hash">{short(hashes[it.kind] ?? it.sha, 10)}</span>
          {ver[it.kind] === undefined ? <span class="tag">verifying…</span>
            : ver[it.kind] ? <span class="tag tag-ok"><Icon name="okShape" size={16} /> Hash verified</span>
            : <span class="tag tag-bad"><Icon name="barShape" size={16} /> {ver[it.kind] === null ? 'Missing' : 'Mismatch'}</span>}
        </li>
      ))}
    </ul>
    </>
  );
}

function FloodInset({ s }: { s: PlotState }) {
  const m = model.value!, p = s.plot;
  const pass = lastPassBefore(m, tSlow.value);
  const d = useMemo(() => (pass === null ? '' : floodPath(m, pass)), [pass]);
  const vb = `${p.cx - 60} ${p.cy - 40} 120 80`;
  return (
    <svg class="inset" viewBox={vb} role="img" aria-label={`Flood overlay around ${p.id} from ${pass === null ? 'no radar pass yet' : 'the simulated radar pass at ' + fmtT(pass)}`}>
      <rect x={p.cx - 60} y={p.cy - 40} width="120" height="80" fill="var(--paper)" />
      <path d={m.raw.map.river} fill="none" stroke="var(--water)" stroke-width="9" />
      <path d={d} fill="var(--water)" opacity=".7" />
      {m.plots.filter((q) => q.v === p.v).map((q) => <polygon key={q.id} points={q.pts.join(' ')} fill="none" stroke="var(--rule-strong)" stroke-width=".6" />)}
      <polygon points={p.pts.join(' ')} fill="none" stroke="var(--kali)" stroke-width="1.8" />
    </svg>
  );
}

export function PlotDrawer() {
  const id = openPlot.value;
  if (!id) return null;
  const r = rows.value.find((x) => x.s.plot.id === id);
  const m = model.value;
  if (!r || !m) return null;
  const s = r.s, p = s.plot, t = tSlow.value;
  return (
    <Sheet
      title={<>{p.id} · {p.name}{s.persona === 'focus' && <span class="tag you">Your farmer</span>}</>}
      onClose={() => (openPlot.value = null)}
      closeLabel="Close plot details"
      class="drawer"
      lang="en"
    >
      <ConsoleNote />
      <div class="dr-meta">
        <p class="eyebrow">{p.village} · {p.crop} · {p.areaHa.toFixed(1)} ha · Khasra {p.khasra}</p>
        <p class="num muted"><span class="id">{policyNo(p.id)}</span> · {stageLabel(s)}</p>
        {s.times.helper ? (
          <p class="muted" data-captured-by>Captured by {s.times.helper.name} ({s.times.helper.role}) with the farmer’s consent, given by {s.times.helper.method === 'voice' ? 'voice' : 'press and hold'}, at <span class="num">{fmtClockEn(s.times.consentT ?? 0)}</span>. Consent and photos are sealed in this farmer’s own log.</p>
        ) : s.times.consentT !== null ? (
          <p class="muted" data-captured-by>Assisted capture: the farmer’s consent is recorded. The scripted scenario does not name the helper.</p>
        ) : null}
        <span class="tag tag-sim"><span class="dot" aria-hidden="true" />Simulated plot</span>
      </div>
      <div class="dr-tier" data-sim-numbers>
        <RowTier r={r} />
        <p><strong>Evidence tier, not {s.rail === 'relief' ? 'a decision' : 'a claim decision'}.</strong> Saboot assembles and ranks evidence for human review. A person at the {s.rail === 'relief' ? 'department' : 'insurer'} decides.</p>
        <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated score</span>
      </div>
      <Pipeline s={s} />
      {s.flags.length > 0 && (
        <ul class="dr-flags" role="list">
          {s.flags.map((f) => <li key={f} class="flag"><Icon name="flag" size={16} /> {flagLabel(f, s.rail)}</li>)}
        </ul>
      )}
      <section aria-labelledby="dr-tl">
        <h3 id="dr-tl">Event timeline</h3>
        <ol class="evlist" role="list">
          {events(s, t).map((e, i) => (
            <li key={i} class={e.tone}>
              <time class="num">{fmtT(e.t)} · {fmtClockEn(e.t)}</time>
              <span class="ev-line">
                {e.tone && <Icon name={e.tone === 'ok' ? 'okShape' : e.tone === 'bad' ? 'barShape' : 'flag'} size={16} />}
                {e.tone && <span class="sr-only">{e.tone === 'ok' ? 'Resolved: ' : e.tone === 'bad' ? 'Problem: ' : 'Attention: '}</span>}
                <span>{e.label}</span>
              </span>
            </li>
          ))}
          {s.timeLeft !== null && s.timeLeft > 0 && s.stage === 'alerted' && <li class="warn"><time>now</time><span>{fmtDurEn(s.timeLeft)} left {s.rail === 'relief' ? 'of the capture-soon advice (not a deadline)' : `in the ${m.opts.windowHours}-hour window`}</span></li>}
        </ol>
      </section>
      <section aria-labelledby="dr-rain">
        <h3 id="dr-rain">Rainfall vs threshold</h3>
        <RainChart m={m} station={p.station} t={t} eventT={s.times.eventT} />
      </section>
      {p.reach.length > 0 && (
        <section aria-labelledby="dr-river">
          <h3 id="dr-river">River stage vs danger level</h3>
          <RiverChart m={m} p={p} t={t} />
        </section>
      )}
      <section aria-labelledby="dr-flood">
        <h3 id="dr-flood">Flood overlay (simulated radar)</h3>
        <div class="inset-row">
          <FloodInset s={s} />
          <div>
            <p class="muted">Share of the plot seen as water at each radar pass. Dashed line = {Math.round(m.raw.thresholds.floodFrac * 100)}% {p.baselineWet ? 'above the paddy’s standing water' : ''} trigger{p.baselineWet ? '; dotted line = the standing water radar sees anyway' : ''}.</p>
            <SarSpark m={m} p={p} t={t} />
            {!s.times.hail && (
              <p class="muted" data-share>
                Radar estimate of the flooded share now: <strong class="num">{Math.round(r.e.floodShare * 100)}%</strong> ± <span class="num">{Math.round(r.e.floodShareUnc * 100)}</span> points. This is not crop damage, which only the officer assesses.
                {s.rail === 'relief' && r.e.floodShare >= RELIEF.damageShareThreshold && <> It is at or above the scenario’s share parameter (<span class="num">{RELIEF.damageShareThreshold}</span>, a labelled assumption), so the plot is listed first in its village.</>}
              </p>
            )}
          </div>
        </div>
      </section>
      <section aria-labelledby="dr-ph">
        <h3 id="dr-ph">Photos and hash verification</h3>
        <Photos s={s} />
      </section>
      <section aria-labelledby="dr-bd" data-sim-numbers>
        <h3 id="dr-bd">Plausibility breakdown <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated</span></h3>
        <Breakdown e={r.e} />
        {r.e.notes.map((n) => <p key={n} class="note note-warn" role="note"><Icon name="info" /><span>{n}</span></p>)}
      </section>
    </Sheet>
  );
}

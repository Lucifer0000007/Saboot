// Pilot metrics: what a pilot would measure, computed on one synthetic replay. Each figure carries its definition.
// The headline is the MEDIAN event-to-call, not the best case: the demo farmer is one plot among many.
import { signal, computed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { fmtDur, fmtT } from '../lib/time';
const fmtDurEn = (h: number) => fmtDur(h, true);
import { model, tSlow, rawScenario, HOURS } from '../sim/engine';
import { liveViews } from '../farmer/focus';
import { plotState } from '../sim/cohort';
import { buildModel } from '../sim/model';
import { modelOptions } from '../sim/options';
import { metrics, pilotMetrics, eventToCall, type Metrics, type PilotMetrics } from '../sim/metrics';
import { rows } from './state';
import { ProvTag, FieldTag } from '../ui/ProvTag';
import { fieldView, TARGET_STATE } from '../data/fieldEvidence';
import en from '../i18n/en';
import { fill } from '../lib/i18n';

const scope = signal<'now' | 'full'>('full');

const fullReplay = computed(() => {
  const m = model.value!;
  const { focus, live } = liveViews(HOURS);
  const states = m.plots.map((p) => plotState(m, p, HOURS, focus, live));
  return { k: metrics(m, states, HOURS), pm: pilotMetrics(m, states, HOURS) };
});
const nowMetrics = computed(() => {
  const m = model.value!;
  const states = rows.value.map((r) => r.s);
  return { k: metrics(m, states, tSlow.value), pm: pilotMetrics(m, states, tSlow.value) };
});

/** Event-to-call under both radar cadences, for the current rail. Both are simulated. */
const cadences = computed(() => {
  const raw = rawScenario.value, m = model.value;
  if (!raw || !m) return null;
  const rl = m.opts.rail;
  return (['demo', 'slow'] as const).map((c) => {
    const cm = buildModel(raw, modelOptions(rl, c));
    const flooded = cm.plots.filter((p) => cm.truth[p.idx]);
    const caught = flooded.filter((p) => cm.det[p.idx].detected).length;
    return { id: c, every: c === 'slow' ? (raw.sarSlow ? raw.sarSlow[1] - raw.sarSlow[0] : null) : raw.sar[1] - raw.sar[0], e: eventToCall(cm), flooded: flooded.length, caught };
  });
});

const pct = (x: number | null) => (x === null ? '—' : Math.round(x * 100) + '%');
const dur = (h: number | null) => (h === null ? '—' : fmtDurEn(h));

interface ReplayCounts { caught: number; missed: number; falseAlarms: number; correctRejections: number; notEvaluable: number; points: number }
/** A real past flood replayed offline through the rules (scripts/replay, docs/REPLAY-METHOD.md): raw counts, never a lead time. */
interface ReplayStatus {
  id: string;
  source: string;
  sample: Record<string, number>;
  farmland?: { ha: number; source: string };
  assumptions: string[];
  ruleB: string;
  scale: string;
  runs: Record<string, { rules: string[]; reportSha256: string; events: Record<string, ReplayCounts> }>;
  credits: { text: string; url?: string }[];
}
/** public/data/validation-status.json: written only by `npm run validate:real -- --publish` from a REAL report, or by scripts/replay/publish.ts from a replay run. */
interface ValidationStatus {
  v: number;
  run: boolean;
  replay?: ReplayStatus;
  dataset?: string | null;
  events?: number;
  villagesLabelled?: number;
  precision?: number | null;
  recall?: number | null;
  rulesEvaluated?: string[];
  reportSha256?: string;
  note?: string;
}
const validation = signal<ValidationStatus | 'error' | null>(null);
function useValidationStatus() {
  useEffect(() => {
    if (validation.value !== null) return;
    fetch('data/validation-status.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((j: ValidationStatus) => (validation.value = j), () => (validation.value = 'error'));
  }, []);
}

export function ImpactCards({ k, pm }: { k: Metrics; pm: PilotMetrics }) {
  const m = model.value!;
  const relief = m.opts.rail === 'relief';
  const fastest = k.tta.length ? Math.min(...k.tta) : null;
  const focusD = m.det[m.plots.findIndex((p) => p.id === m.raw.focus)];
  const focusTta = focusD && focusD.alertT !== null && focusD.eventT !== null ? focusD.alertT - focusD.eventT : null;
  const share = k.floodEvents ? k.filedInWindow / k.floodEvents : null;
  return (
    <ul class="impact" role="list">
      <li class="lead" data-metric="median-event-to-call">
        <span class="eyebrow">Typical farmer: event to call (median)</span>
        <strong class="num">{dur(k.ttaMedian)}</strong>
        <span>
          Hours from the start of the event to the voice call, over every alerted plot ({k.alerted} of them). Half of the farmers hear sooner, half later.
          90th percentile <span class="num">{dur(k.ttaP90)}</span>. Fastest plot so far <span class="num">{dur(fastest)}</span>.
          The demo farmer {m.raw.focus} is one plot, at <span class="num">{dur(focusTta)}</span>: not the typical case.
        </span>
      </li>
      <li data-metric="evidence-on-file">
        <span class="eyebrow">Flooded plots with evidence on file</span>
        <strong class="num">{pm.truthFlooded ? pct(pm.truthWithEvidence / pm.truthFlooded) : '—'}</strong>
        <span>{pm.truthWithEvidence} of {pm.truthFlooded} plots flooded in the synthetic truth have sealed evidence received. In a pilot this would use officer-confirmed plots.</span>
      </li>
      <li data-metric="event-to-evidence">
        <span class="eyebrow">Event to evidence on file (median)</span>
        <strong class="num">{dur(pm.eventToEvidence.median)}</strong>
        <span>Hours from the start of the event to the evidence being received, over {pm.eventToEvidence.n} plots with evidence. Offline queues are included.</span>
      </li>
      {relief ? (
        <li data-metric="objections">
          <span class="eyebrow">Objections filed</span>
          <strong class="num">{pm.published ? pct(pm.objectionRate) : '—'}</strong>
          <span>
            {pm.published
              ? `${pm.objections} of the ${pm.onList} plots the rules found an event for had sealed evidence attached in the objection window; ${pm.objectionsAnswered} answered by the officer, outside Saboot. Scripted, not a forecast.`
              : 'The officer publishes the draft list later in the replay (simulated). Objections are counted from then.'}
          </span>
        </li>
      ) : (
        <li data-metric="reported-in-window">
          <span class="eyebrow">Reported within window</span>
          <strong class="num">{pct(share)}</strong>
          <span>{k.filedInWindow} of {k.floodEvents} alerted flood events · {k.missed} missed · {k.filedLate} late</span>
        </li>
      )}
    </ul>
  );
}

function CadenceTable() {
  const c = cadences.value;
  if (!c) return null;
  return (
    <div class="card stack" data-metric="cadence">
      <h4>Radar cadence: demo and slower (both simulated)</h4>
      {/* Source: ESA Sentinel-1 mission overview (revisit interval confirmed by the owner). */}
      <p class="muted">
        The replay uses a fast simulated radar cadence so a demo fits in a minute. A real satellite revisits a field less often, so the slower option is closer to what to expect. Radar satellites revisit a field every 6 days using two satellites (Sentinel-1C and 1D), or every 12 days with one.
        It is still a simulation, not a measured revisit time. At the slower cadence the radar rule misses plots it would have caught late, so the percentiles cover fewer plots: read them with the count of flooded plots never alerted.
      </p>
      <table class="rtable cad-table">
        <caption class="sr-only">Event to call under the two simulated radar cadences</caption>
        <thead>
          <tr><th scope="col">Radar cadence</th><th scope="col">Flooded plots alerted</th><th scope="col">Flooded plots never alerted</th><th scope="col">Median</th><th scope="col">90th percentile</th><th scope="col">Fastest</th></tr>
        </thead>
        <tbody>
          {c.map((x) => (
            <tr key={x.id} class={model.value!.opts.cadence === x.id ? 'sel' : ''}>
              <th scope="row" data-l="Radar cadence">{x.id === 'demo' ? 'Demo' : 'Slower'}: a pass every <span class="num">{x.every ?? '—'}</span> h{model.value!.opts.cadence === x.id && <span class="sub">shown above</span>}</th>
              <td data-l="Flooded plots alerted" class="num">{x.caught} of {x.flooded}</td>
              <td data-l="Flooded plots never alerted" class="num">{x.flooded - x.caught}</td>
              <td data-l="Median" class="num">{dur(x.e.median)}<span class="sub">over {x.e.n} alerted plots</span></td>
              <td data-l="90th percentile" class="num">{dur(x.e.p90)}</td>
              <td data-l="Fastest" class="num">{dur(x.e.min)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValidationBlock() {
  useValidationStatus();
  const v = validation.value;
  return (
    <div class="card stack" data-metric="validation">
      <h4>Validation against real data</h4>
      {v === null ? <p class="muted">Checking the validation status…</p>
        : v === 'error' ? <p class="muted">The validation status could not be read.</p>
        : v.run && v.replay ? <ReplayBlock r={v.replay} />
        : v.run ? (
          <div class="stack" data-validation-run="true">
            <p><Icon name="check" size={16} /> A real-data validation report is on record. These numbers come from real inputs with a named source, not from this replay.</p>
            <dl class="kv">
              <div><dt>Dataset</dt><dd>{v.dataset ?? 'not named'}</dd></div>
              <div><dt>Events, villages scored</dt><dd class="num">{v.events ?? '—'} · {v.villagesLabelled ?? '—'}</dd></div>
              <div><dt>Precision, recall</dt><dd class="num">{pct(v.precision ?? null)} · {pct(v.recall ?? null)}, village level</dd></div>
              <div><dt>Rules evaluated</dt><dd>{(v.rulesEvaluated ?? []).join(', ') || '—'}</dd></div>
              <div><dt>Report fingerprint</dt><dd class="hash num">{v.reportSha256 ?? '—'}</dd></div>
            </dl>
            <p class="muted">{v.note ?? 'See the validation guide in the docs folder for what this does and does not show.'}</p>
          </div>
        ) : (
          <p class="note note-warn" data-validation-run="false"><Icon name="info" /><span><strong>Not run.</strong> Every number on this page comes from one synthetic replay. A pilot would run the validation harness on historical flood records and publish the result here. See the validation guide in the docs folder.</span></p>
        )}
    </div>
  );
}

const RUN_LABEL: Record<string, string> = { A: 'Rule A (rain) only', C: 'Rule C (river) only', AC: 'Rules A and C' };
const EVENT_LABEL: Record<string, string> = { 'R1-FLOOD': 'flood window', 'R1-DRY': 'quiet window (assumed dry)' };
const ratio = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

/** Raw counts first; a ratio only beside the counts it comes from; the source by its ID; the assumptions and limits in full. */
function ReplayBlock({ r }: { r: ReplayStatus }) {
  const flood = (run: string) => r.runs[run]?.events['R1-FLOOD'];
  const dry = (run: string) => r.runs[run]?.events['R1-DRY'];
  return (
    <div class="stack" data-validation-run="true" data-replay={r.id}>
      <p><ProvTag prov="replay" english /> <strong>Replay {r.id}.</strong> Two of the rules, as this app codes them, were run offline over one real past flood: <span class="num">{r.sample.points}</span> sample points of a published flood map ({r.sample.affected} inside the mapped flood, {r.sample.not_affected} outside it) in {r.sample.rainCells} rain cells. Source: {r.source}. No farmer, field or claim is involved, and nothing here is a lead time.</p>
      <table class="rtable">
        <caption class="sr-only">Replay {r.id}: raw counts per run and window</caption>
        <thead>
          <tr><th scope="col">Run</th><th scope="col">Window</th><th scope="col">Caught</th><th scope="col">Missed</th><th scope="col">False alarms</th><th scope="col">Correct rejections</th><th scope="col">Could not run</th></tr>
        </thead>
        <tbody>
          {Object.keys(r.runs).flatMap((run) => (['R1-FLOOD', 'R1-DRY'] as const).map((ev) => {
            const c = r.runs[run].events[ev];
            return c ? (
              <tr key={run + ev}>
                <th scope="row">{RUN_LABEL[run] ?? run}</th>
                <td data-l="Window">{EVENT_LABEL[ev] ?? ev}</td>
                <td data-l="Caught" class="num">{c.caught}</td>
                <td data-l="Missed" class="num">{c.missed}</td>
                <td data-l="False alarms" class="num">{c.falseAlarms}</td>
                <td data-l="Correct rejections" class="num">{c.correctRejections}</td>
                <td data-l="Could not run" class="num">{c.notEvaluable}</td>
              </tr>
            ) : null;
          }))}
        </tbody>
      </table>
      {r.farmland && (
        <p data-replay-farmland>
          In this one activation the first flood maps covered about <strong class="num">{Math.round(r.farmland.ha / 1000)},000 ha</strong> of farmland. The scale of the problem, from the map maker's own statistics; not a result of this app.
        </p>
      )}
      {flood('A') && dry('A') && (
        <p class="muted" data-replay-sentence>
          In one sentence: on one real flood, rain alone would have flagged <span class="num">{flood('A')!.caught} of the {flood('A')!.caught + flood('A')!.missed}</span> mapped-flooded points ({ratio(flood('A')!.caught, flood('A')!.caught + flood('A')!.missed)}) and <span class="num">{flood('A')!.falseAlarms} of the {flood('A')!.falseAlarms + flood('A')!.correctRejections}</span> mapped-dry ones ({ratio(flood('A')!.falseAlarms, flood('A')!.falseAlarms + flood('A')!.correctRejections)}); in a quiet fortnight it flagged <span class="num">{dry('A')!.falseAlarms} of {dry('A')!.points}</span>.
          {flood('C') && <> The river rule fires for every point within its nominal reach, flooded or not ({flood('C')!.caught} caught, {flood('C')!.falseAlarms} false alarms, {flood('C')!.notEvaluable} out of reach), which is what the method said to expect.</>}
        </p>
      )}
      <p class="muted"><strong>Scale.</strong> {r.scale}</p>
      <p class="muted"><strong>Assumptions, stated before the run:</strong> {r.assumptions.join('; ')}.</p>
      <p class="muted"><strong>Rule B (radar):</strong> {r.ruleB}.</p>
      <p class="muted">Method and sampling: the replay method in the docs folder, committed before the run. Report fingerprints: {Object.entries(r.runs).map(([run, x]) => `${run} ${x.reportSha256.slice(0, 12)}`).join(' · ')}.</p>
      <p class="small muted">{r.credits.map((c, i) => <span key={i}>{c.text}{c.url && <> <a href={c.url} target="_blank" rel="noopener noreferrer">{c.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></>}{' '}</span>)}</p>
    </div>
  );
}

/** What is real about adoption: the recorded interviews (src/data/fieldEvidence.ts). Every number comes from fieldCounts();
 *  letters and users appear only above zero, and a quote only when the raw note has one. English, like the console. */
function FieldStrip() {
  const v = fieldView();
  const c = v.counts;
  if (c.interviews + c.letters + c.users === 0) return null;
  const t = (k: string, vars: Record<string, string | number>) => fill(en[k] as string, vars);
  return (
    <div class="card stack" data-field-evidence>
      <div class="row-between"><h4>{en['fe.h'] as string}</h4><FieldTag english /></div>
      <p class="fe-strip" data-field-strip>{t('fe.strip', { n: c.interviews, states: c.states, roles: c.roles })}</p>
      <p class="muted" data-field-target>{t('fe.target', { state: TARGET_STATE, n: c.inTargetState })}</p>
      {(v.showLetters || v.showUsers) && (
        <ul class="fieldstrip" role="list">
          {v.showLetters && <li data-field-letters>{t('fe.letters', { n: c.letters })}</li>}
          {v.showUsers && <li data-field-users>{t('fe.users', { n: c.users })}</li>}
        </ul>
      )}
      {v.themes.length > 0 && (
        <>
          <h4>{en['fe.raised'] as string}</h4>
          <ul class="fe-themes" role="list" data-field-themes>
            {v.themes.map((x) => <li key={x.id + x.theme}><FieldTag english /> <span>{t('fe.theme', { state: x.state, theme: x.theme })}</span></li>)}
          </ul>
        </>
      )}
      {v.quotes.map((q) => <blockquote key={q.id} class="fe-quote" data-field-quote>{t('fe.quote', { quote: q.quote, role: q.role, state: q.state })}</blockquote>)}
      <p class="muted small">{en['fe.note'] as string}</p>
    </div>
  );
}

export function Impact() {
  const { k, pm } = scope.value === 'full' ? fullReplay.value : nowMetrics.value;
  const relief = model.value!.opts.rail === 'relief';
  return (
    <section class="impactp" aria-labelledby="im-h" data-sim-numbers>
      <div class="row-between">
        <h3 id="im-h" class="h-sm">{relief ? 'Pilot metrics on this replay' : 'Impact on this replay'}</h3>
        <div class="seg" role="group" aria-label="Metric scope">
          <button type="button" aria-pressed={scope.value === 'full'} onClick={() => (scope.value = 'full')}>Full replay</button>
          <button type="button" aria-pressed={scope.value === 'now'} onClick={() => (scope.value = 'now')}>As of {fmtT(tSlow.value)}</button>
        </div>
      </div>
      <p class="note note-plain" data-sim-label><Icon name="info" /><span><strong>Simulated.</strong> Computed live from one synthetic, seeded replay with scripted farmer behaviour. These are not real-world results and must not be quoted as impact.</span></p>
      <ImpactCards k={k} pm={pm} />
      <CadenceTable />
      <div class="card stack" data-metric="consistency">
        <h4>Simulated consistency check, not validation</h4>
        <p class="muted">
          The table compares the detection rules with the generator’s own synthetic flood. The river series is made from the same simulated flood the rules are then tested on,
          so agreement is partly by construction. Precision <span class="num">{pct(k.precision)}</span>, recall <span class="num">{pct(k.recall)}</span> say the code runs as designed, not how it would perform on real floods.
        </p>
        <table class="cm">
          <caption class="sr-only">Detection versus the synthetic flood</caption>
          <thead><tr><th scope="col" /><th scope="col">Flooded in the synthetic truth</th><th scope="col">Not flooded</th></tr></thead>
          <tbody>
            <tr><th scope="row">Detected</th><td class="good">{k.tp}</td><td class="badc">{k.fp}</td></tr>
            <tr><th scope="row">Not detected</th><td class="badc">{k.fn}</td><td>{k.tn}</td></tr>
          </tbody>
        </table>
        <p class="muted">
          Detected but not flooded plots are handled by the farmer’s “no damage” reply (logged, no claim started). Tall crops (sugarcane, maize) hide water from radar,
          which is why Saboot also lets farmers report on their own. Hail: {k.hailPrompted} low-confidence prompts sent, {k.hailYes} farmers replied “yes”.
        </p>
      </div>
      <ValidationBlock />
      <FieldStrip />
      <p class="note note-plain" role="note"><Icon name="gavel" /><span><strong>Decision happens outside Saboot.</strong> None of these figures is a decision about any claim, eligibility or amount.</span></p>
    </section>
  );
}

// Insurer & district console (feature C). English-only by design; every number here is simulated.
import '../styles/console.css';
import { Icon, type IconName } from '../ui/Icon';
import { fmtClock, fmtT } from '../lib/time';
const fmtClockEn = (h: number, withDay = true) => fmtClock(h, withDay, true);
import { lazy } from '../lib/lazy';
import { insurerView, importCode, importReceived, deepLinkDone, type InsurerView } from '../site/layout';
import { model, tSlow } from '../sim/engine';
import { moments, jumpTo } from '../sim/moments';
import { rail } from '../lib/prefs';
import { kpis } from './state';
import { effect } from '@preact/signals';
import { receiver } from '../lib/prefs';
import { receipts } from '../k/receipt';
import { useEffect, useRef } from 'preact/hooks';
import { loadImported } from '../k/imported';
import { loadAssignments } from './assign';
import { loadNoted } from './responses';
import { DistrictMap, Legend, MapDefs } from './DistrictMap';
import { PlotList } from './PlotList';
import { PlotDrawer } from './PlotDrawer';
import { ImportedDrawer } from './ImportedDrawer';
import { Pipeline } from './Pipeline';
import { DraftView } from './DraftView';
import { Impact } from './Impact';
import { TamperCheck } from './TamperCheck';

const ImportSheet = lazy(() => import('./Import'), 0);

const VIEWS: Record<'relief' | 'pmfby', [InsurerView, string, IconName][]> = {
  pmfby: [['claims', 'Map & worklist', 'map'], ['ledger', 'Tamper check', 'shield'], ['impact', 'Impact (simulated)', 'scale']],
  relief: [['claims', 'Map & worklist', 'map'], ['draft', 'Draft list', 'file'], ['ledger', 'Tamper check', 'shield']],
};

function Kpis() {
  const k = kpis.value;
  const pm = rail.value === 'pmfby';
  const items: [string, number, string, ('warn' | 'bad')?][] = [
    ['Events alerted', k.events, 'Plots with a detected event or a hail prompt'],
    ['Evidence received', k.received, 'Packets received by the simulated server'],
    pm ? ['Reported in window', k.inWindow, 'Detected floods with a reference recorded before the deadline'] : ['Shown to the officer', k.reported, 'Receipt number noted by the farmer'],
    pm ? ['At risk', k.atRisk, 'Alerted, no evidence, under 24 h left', k.atRisk ? 'warn' : undefined] : ['Capture soon', k.atRisk, 'Alerted, no evidence yet, under 24 h of advice left', k.atRisk ? 'warn' : undefined],
    pm ? ['Window missed', k.missed, 'Deadline passed without evidence', k.missed ? 'bad' : undefined] : ['No evidence yet', k.missed, 'Advice window passed with no evidence', k.missed ? 'warn' : undefined],
    ['Flagged for review', k.flagged, pm ? 'Sync gaps, off-plot photos, overdue acknowledgements' : 'Sync gaps, off-plot photos, overdue officer acknowledgements'],
  ];
  return (
    <ul class="kpis" role="list" aria-label="Key figures at the current replay time (simulated)">
      {items.map(([l, v, d, tone]) => (
        <li key={l} class={tone}>
          <strong class="num">{v}</strong>
          <span class="kpi-l">{tone === 'warn' && <Icon name="clock" size={16} />}{tone === 'bad' && <Icon name="barShape" size={16} />}{l}</span>
          <span class="kpi-d">{d}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const m = model.value!;
  // the draft list belongs to the relief rail; on the PMFBY rail the same tab falls back to the map
  // the relief rail's pilot metrics are a future pilot's figures, not a step in the demo: they sit under the draft list
  // instead of in a view of their own (audit S-11, FEATURE-MAP F17); an 'impact' link opens the draft list there
  const relief = rail.value === 'relief';
  const view = insurerView.value === 'draft' && !relief ? 'claims' : insurerView.value === 'impact' && relief ? 'draft' : insurerView.value;
  useEffect(() => { void loadImported(); void loadAssignments(); void loadNoted(); }, []);
  // the chosen view stays visible in the bar when it scrolls sideways on a phone (the page itself does not move)
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current, b = el?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (el && b && (b.offsetLeft < el.scrollLeft || b.offsetLeft + b.offsetWidth > el.scrollLeft + el.clientWidth)) el.scrollLeft = b.offsetLeft - 4;
  }, [view]);
  // the demo receiver's list, polled only when this laptop is the receiver (the preference is off by default). An effect,
  // not a mount-time check: on a laptop the console can mount before the deep link has set the preference.
  useEffect(() => {
    let stop: (() => void) | undefined;
    const dispose = effect(() => {
      if (receiver.value && !stop) void import('../k/receipt').then((m) => { if (!stop) stop = m.startReceiptPoll(); });
    });
    return () => { dispose(); stop?.(); };
  }, []);
  // an officer link moves the replay to its moment after the page starts; until then the console waits in its loading
  // state, so the figures do not render at T+0 and then jump down the page (Lighthouse layout shift on ?tab=insurer)
  // (a full screen tall: with the view switch moved into the dock on a phone, 480 px let the next section show and then move)
  if (!deepLinkDone.value) return <div class="loading" style={{ minHeight: '100vh' }} role="status" aria-busy="true"><span class="spin" aria-hidden="true" /></div>;
  return (
    <section class="dash" aria-labelledby="dash-h" data-tour="dash" data-sim-numbers>
      <MapDefs />
      <header class="dash-head">
        <p class="eyebrow">{rail.value === 'relief' ? 'Officer console' : 'Insurer & district console'}</p>
        <h3 id="dash-h" class="h-sm">Ranked evidence, not verdicts</h3>
        <p class="muted">
          {m.raw.district} · replay at <strong class="num">{fmtT(tSlow.value)}</strong> (<span class="num">{fmtClockEn(tSlow.value)}</span> IST). Evidence tiers rank review work; they are not {rail.value === 'relief' ? 'decisions' : 'claim decisions'}.
        </p>
        <div class="row">
          <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated data</span>
          <button type="button" class="pill pill-ghost pill-sm" onClick={() => (importCode.value = '')}><Icon name="scan" size={16} /> Import evidence</button>
          {receiver.value && (
            <button type="button" class="pill pill-ghost pill-sm" data-received-count onClick={() => { importReceived.value = true; importCode.value = ''; }}>
              <Icon name="inbox" size={16} /> <span class="num">{receipts.value.length}</span> received over the network
            </button>
          )}
        </div>
      </header>
      {/* the views stay in reach: a bar that sticks under the nav (and the control bar on a laptop) while the console scrolls */}
      <div class="seg view-seg" role="radiogroup" data-view-bar aria-label="Console view" ref={bar}>
        {VIEWS[rail.value].map(([id, label, icon]) => (
          <button key={id} type="button" role="radio" aria-checked={view === id} onClick={() => (insurerView.value = id)}>
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>
      {kpis.value.events === 0 && (
        // before the flood the console is empty: say so, and offer the moments where it has something to show (audit OF-07)
        <div class="note note-plain" data-t0>
          <Icon name="info" />
          <div class="stack">
            <p><strong>No plot has been alerted yet at <span class="num">{fmtT(tSlow.value)}</span>.</strong> Play the replay, or jump to a moment:</p>
            <div class="row">
              {moments.value.filter((x) => x.id === 'deadline' || x.id === 'draft').map((x) => (
                <button key={x.id} type="button" class="pill pill-ghost pill-sm" data-t0-jump={x.id} onClick={() => void jumpTo(x.id)}>{x.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* the figures and the pipeline belong to the worklist; the other views have their own (the draft list's steps,
          the pilot metrics), so on a phone they open on their content */}
      {view === 'claims' && (
        <>
          <Kpis />
          <Pipeline />
          <div class="claims">
            <div class="claims-map">
              <DistrictMap />
              <Legend />
            </div>
            <PlotList />
          </div>
        </>
      )}
      {view === 'draft' && <DraftView />}
      {view === 'ledger' && <TamperCheck />}
      {(view === 'impact' || (view === 'draft' && relief)) && <Impact />}
      <PlotDrawer />
      <ImportedDrawer />
      {importCode.value !== null && <ImportSheet initial={importCode.value || undefined} onClose={() => { importCode.value = null; if (location.hash.startsWith('#k=')) history.replaceState(null, '', location.pathname + location.search); }} />}
    </section>
  );
}

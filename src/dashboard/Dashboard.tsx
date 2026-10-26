// Insurer & district console (feature C). English-only by design; every number here is simulated.
import '../styles/console.css';
import { Icon, type IconName } from '../ui/Icon';
import { fmtClock, fmtT } from '../lib/time';
const fmtClockEn = (h: number, withDay = true) => fmtClock(h, withDay, true);
import { lazy } from '../lib/lazy';
import { insurerView, importCode, importReceived, type InsurerView } from '../site/layout';
import { model, tSlow } from '../sim/engine';
import { rail } from '../lib/prefs';
import { kpis } from './state';
import { effect } from '@preact/signals';
import { receiver } from '../lib/prefs';
import { receipts } from '../k/receipt';
import { useEffect } from 'preact/hooks';
import { loadImported } from '../k/imported';
import { DistrictMap, Legend, MapDefs } from './DistrictMap';
import { PlotList } from './PlotList';
import { PlotDrawer } from './PlotDrawer';
import { Pipeline } from './Pipeline';
import { DraftView } from './DraftView';
import { Impact } from './Impact';

const ImportSheet = lazy(() => import('./Import'), 0);

const VIEWS: Record<'relief' | 'pmfby', [InsurerView, string, IconName][]> = {
  pmfby: [['claims', 'Map & worklist', 'map'], ['impact', 'Impact (simulated)', 'scale']],
  relief: [['claims', 'Map & worklist', 'map'], ['draft', 'Draft list', 'file'], ['impact', 'Pilot metrics (simulated)', 'scale']],
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
  const view = insurerView.value === 'draft' && rail.value !== 'relief' ? 'claims' : insurerView.value;
  useEffect(() => { void loadImported(); }, []);
  // the demo receiver's list, polled only when this laptop is the receiver (the preference is off by default). An effect,
  // not a mount-time check: on a laptop the console can mount before the deep link has set the preference.
  useEffect(() => {
    let stop: (() => void) | undefined;
    const dispose = effect(() => {
      if (receiver.value && !stop) void import('../k/receipt').then((m) => { if (!stop) stop = m.startReceiptPoll(); });
    });
    return () => { dispose(); stop?.(); };
  }, []);
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
      <Kpis />
      <Pipeline />
      <div class="seg view-seg" role="radiogroup" aria-label="Console view">
        {VIEWS[rail.value].map(([id, label, icon]) => (
          <button key={id} type="button" role="radio" aria-checked={view === id} onClick={() => (insurerView.value = id)}>
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </div>
      {view === 'claims' && (
        <div class="claims">
          <div class="claims-map">
            <DistrictMap />
            <Legend />
          </div>
          <PlotList />
        </div>
      )}
      {view === 'draft' && <DraftView />}
      {view === 'impact' && <Impact />}
      <PlotDrawer />
      {importCode.value !== null && <ImportSheet initial={importCode.value || undefined} onClose={() => { importCode.value = null; if (location.hash.startsWith('#k=')) history.replaceState(null, '', location.pathname + location.search); }} />}
    </section>
  );
}

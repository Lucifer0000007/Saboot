// The simulation section: control bar + farmer phone + insurer/ledger/explainer panels.
// Desktop: sticky control bar on top, phone left, tabbed panel right. Below 1024px: tabs and a bottom dock.
import { useEffect } from 'preact/hooks';
import { lazy } from '../lib/lazy';
import { tr, trr } from '../lib/i18n';
import { RailSwitch, CadenceSwitch } from '../ui/RailSwitch';
import { SCENARIO } from '../generated/scenario-summary';
import { ConsoleNote } from '../dashboard/ConsoleNote';
import { tourSeen } from '../lib/prefs';
import { model, loadError, loadScenario } from '../sim/engine';
import { FarmerApp } from '../farmer/FarmerApp';
import { ControlBar } from '../ui/ControlBar';
import { Icon, type IconName } from '../ui/Icon';
import { tourStep, startTour } from '../tour/state';
import { layout, simTab, panelTab, bigText, type SimTab } from './layout';

export const Dashboard = lazy(() => import('../dashboard/Dashboard'), 900);
export const LedgerPanel = lazy(() => import('../dashboard/LedgerPanel'), 900);
export const Explainer = lazy(() => import('../explainer/Explainer'), 900);

const TABS: [SimTab, string, IconName][] = [
  ['farmer', 'sim.tab.farmer', 'phone'],
  ['insurer', 'sim.tab.insurer', 'map'],
  ['ledger', 'sim.tab.ledger', 'link'],
  ['explainer', 'sim.tab.explainer', 'rain'],
];

function Tabs({ tabs, active, label, idPrefix }: { tabs: typeof TABS; active: SimTab; label: string; idPrefix: string }) {
  return (
    <div class={'sim-tabs' + (tabs.length === 3 ? ' panel-tabs' : '')} role="tablist" aria-label={label}>
      {tabs.map(([id, k, icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={idPrefix + id}
          aria-selected={active === id}
          aria-controls={idPrefix + 'panel'}
          tabIndex={active === id ? 0 : -1}
          onClick={() => (simTab.value = id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x[0] === active);
            const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!n) return;
            e.preventDefault();
            const next = tabs[(i + n + tabs.length) % tabs.length][0];
            simTab.value = next;
            document.getElementById(idPrefix + next)?.focus();
          }}
        >
          <Icon name={icon} />
          <span>{trr(k)}</span>
        </button>
      ))}
    </div>
  );
}


function Panel({ tab }: { tab: Exclude<SimTab, 'farmer'> }) {
  return (
    <div class="panel" lang="en">
      {tab === 'insurer' && <Dashboard />}
      {tab === 'ledger' && <LedgerPanel />}
      {tab === 'explainer' && <Explainer />}
    </div>
  );
}

function TourInvite() {
  if (tourSeen.value || tourStep.value !== null) return null;
  return (
    <div class="invite" role="region" aria-label={tr('tour.invite')}>
      <Icon name="tour" />
      <p>{tr('tour.invite')}</p>
      <button type="button" class="pill pill-dark pill-sm" onClick={() => startTour()}>{tr('tour.start')}</button>
      <button type="button" class="link-arrow" onClick={() => (tourSeen.value = true)}>{tr('tour.dismiss')}</button>
    </div>
  );
}

export function SimHead() {
  return (
    <div class="sim-head">
      <p class="eyebrow">{tr('sim.eyebrow')}</p>
      <h2 id="sim-h">{tr('sim.h')}</h2>
      <p class="lede">{tr('sim.lead', { plots: SCENARIO.plots })}</p>
      <div class="rails">
        <RailSwitch />
        <CadenceSwitch />
      </div>
    </div>
  );
}

export function Simulation() {
  const L = layout.value;
  const m = model.value;
  // on a phone the unframed farmer app spans the screen edge to edge (the page gutter moves inside the app)
  const bleed = !!m && L === 'mobile' && simTab.value === 'farmer';
  useEffect(() => {
    // Warm the panel chunks once the page is idle so tab switches are instant.
    const idle = (window as Window & { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500));
    idle(() => { Dashboard.preload(); });
  }, []);
  const body = !m ? (
    loadError.value ? (
      <div class="stack">
        <p class="note note-bad" role="alert">{tr('sim.loadError')}</p>
        <button type="button" class="pill pill-primary" onClick={() => void loadScenario()}>{tr('sim.retry')}</button>
      </div>
    ) : <div class="loading sim-ph" role="status">{tr('sim.loading')}</div>
  ) : L === 'desktop' ? (
    <div class="sim-grid">
      <div class="phone-col">
        <div class="phone" data-tour="phone"><FarmerApp framed /></div>
        <p class="phone-cap">{tr('sim.phoneCap')}</p>
      </div>
      <div class="panel-col">
        <Tabs tabs={TABS.slice(1)} active={panelTab.value} label={tr('sim.tabs')} idPrefix="pt-" />
        <ConsoleNote />
        <div id="pt-panel" role="tabpanel" aria-labelledby={'pt-' + panelTab.value}>
          <Panel tab={panelTab.value} />
        </div>
      </div>
    </div>
  ) : (
    <>
      <Tabs tabs={TABS} active={simTab.value} label={tr('sim.tabs')} idPrefix="st-" />
      <div id="st-panel" role="tabpanel" aria-labelledby={'st-' + simTab.value}>
        {simTab.value === 'farmer' ? (
          L === 'tablet' && !bigText.value ? (
            <div class="phone-col">
              <div class="phone" data-tour="phone"><FarmerApp framed /></div>
              <p class="phone-cap">{tr('sim.phoneCap')}</p>
            </div>
          ) : (
            <div class="farmer-solo" data-tour="phone"><FarmerApp /></div>
          )
        ) : (
          <>
            <ConsoleNote />
            <Panel tab={simTab.value} />
          </>
        )}
      </div>
    </>
  );
  return (
    <section id="simulation" class="sec sim" aria-labelledby="sim-h">
      <div class="wrap">
        <SimHead />
        <TourInvite />
      </div>
      {L === 'desktop' && m && <ControlBar />}
      <div class={'wrap sim-body' + (bleed ? ' sim-bleed' : '')}>{body}</div>
      {L !== 'desktop' && m && <ControlBar />}
    </section>
  );
}

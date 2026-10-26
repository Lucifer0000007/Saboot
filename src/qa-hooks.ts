// Deterministic state setup for the QA suite (tests/qa) and the presenter: window.__sab.
// Tiny, side-effect free until called; ships in the bundle because QA runs against the production build.
import { seek, pause, model, t, activePlotId } from './sim/engine';
import { helperDemo } from './farmer/helper';
import { jumpTo, type MomentId } from './sim/moments';
import { ensureFocus, syncOutbox, full, view, chain, fileObjection, logs, type Link, type FocusEvent } from './farmer/focus';
import { screen, settingsOpen, type Screen } from './farmer/nav';
import { network, rail, cadence, type Net } from './lib/prefs';
import { setLang } from './lib/i18n';
import { simTab, insurerView, openPlot, deepLinkDone, type SimTab, type InsurerView } from './site/layout';
import { imported } from './k/imported';
import { startTour, tourStep } from './tour/state';
import type { Lang } from './sim/types';

const ready = () => new Promise<void>((res) => {
  const tick = () => (model.value && deepLinkDone.value ? res() : setTimeout(tick, 30));
  tick();
});

/** What each farmer's own device log holds: for the tests that prove consent and photos are sealed per farmer. */
type Of<T extends FocusEvent['type']> = Extract<FocusEvent, { type: T }>;
const logInfo = (c: Link[]) => {
  const consent = c.find((l) => l.body.type === 'consent')?.body as Of<'consent'> | undefined;
  const seal = c.find((l) => l.body.type === 'seal')?.body as Of<'seal'> | undefined;
  const shots = c.filter((l) => l.body.type === 'shot').map((l) => (l.body as Of<'shot'>).data.helper ?? null);
  return {
    events: c.length,
    head: c[c.length - 1]?.hash ?? null,
    consentFarmer: consent?.data.farmer ?? null,
    consentHelper: consent?.data.helper ?? null,
    consentLang: consent?.data.lang ?? null,
    packetHash: seal?.data.packetHash ?? null,
    shotHelpers: shots,
    shotShas: c.filter((l) => l.body.type === 'shot').map((l) => (l.body as Of<'shot'>).data.sha),
  };
};

export function installQaHooks() {
  (window as unknown as { __sab: unknown }).__sab = {
    ready,
    seek: (h: number) => { pause(); seek(h); },
    jump: (id: MomentId) => jumpTo(id),
    ensure: (stage: 'captured' | 'sealed' | 'filed') => ensureFocus(stage),
    screen: (s: Screen | null) => (screen.value = s),
    // 'ledger' was a tab of its own; it is now the console's tamper check (audit S-05)
    tab: (tab: SimTab | 'ledger') => { if (tab === 'ledger') { simTab.value = 'insurer'; insurerView.value = 'ledger'; } else simTab.value = tab; },
    // 'triage' was the separate worklist, merged into the map's ranked list (audit OF-04): the old name still opens it
    insurer: (v: InsurerView | 'triage') => (insurerView.value = v === 'triage' ? 'claims' : v),
    plot: (id: string | null) => (openPlot.value = id),
    rail: (r: 'relief' | 'pmfby') => (rail.value = r),
    cadence: (c: 'demo' | 'slow') => (cadence.value = c),
    net: (n: Net) => { network.value = n; if (n !== 'offline') void syncOutbox(); },
    lang: (l: Lang) => setLang(l),
    settings: (open: boolean) => (settingsOpen.value = open),
    tour: (step: number | null) => { if (step === null) tourStep.value = null; else { startTour(); tourStep.value = step; } },
    objection: () => fileObjection(),
    helper: (n: number) => helperDemo(n),
    logs: () => Object.fromEntries(Object.entries(logs.value).map(([k, c]) => [k, logInfo(c)])),
    active: (id: string | null) => (activePlotId.value = id),
    kcode: () => import('./farmer/ShareToLaptop').then((m) => m.buildCode()),
    imported: () => imported.value.map(({ plot, head, importedAt }) => ({ plot, head, importedAt })),
    state: () => ({ t: t.value, shots: full.value.shotCount, queued: view.value.queued, sealed: !!full.value.seal, events: chain.value.length }),
  };
}

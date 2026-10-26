import { computed, effect } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { Icon, type IconName } from '../ui/Icon';
import { tr, trr, langReady } from '../lib/i18n';
import { voiceMode, network, browserOnline, rail } from '../lib/prefs';
import { storageOk, storagePersistent } from '../lib/db';
import { say, stopVoice } from '../lib/voice';
import { announce } from '../lib/announce';
import { t, focusPlot, focusDet, activePlotId } from '../sim/engine';
import { view, syncOutbox, rewound, helperSession } from './focus';
import { screen, settingsOpen, type Screen } from './nav';
import { ConnStrip } from './ConnStrip';
import { Home } from './screens/Home';
import { Capture } from './screens/Capture';
import { Packet } from './screens/Packet';
import { FileClaim } from './screens/File';
import { Status } from './screens/Status';
import { Assist } from './screens/Assist';
import { Helper } from './screens/Helper';
import { backToQueue } from './helper';

const autoScreen = computed<Screen>(() => {
  const d = focusDet.value, v = view.value;
  if (!d || d.alertT === null || t.value < d.alertT || v.noDamage !== null) return 'home';
  if (!v.shotCount) return 'home';
  if (!v.seal) return 'capture';
  if (!v.ref) return 'file';
  return 'status';
});
export const current = computed<Screen>(() => screen.value ?? autoScreen.value);

const NAV: [Screen, IconName, string][] = [
  ['home', 'home', 'f.nav.home'],
  ['capture', 'camera', 'f.nav.photos'],
  ['packet', 'shield', 'f.nav.packet'],
  ['file', 'file', 'f.nav.file'],
  ['status', 'list', 'f.nav.status'],
];

// Coming back online (simulated or real) flushes the IndexedDB outbox automatically; network changes are announced.
let lastNet: string | null = null;
if (typeof window !== 'undefined') {
  effect(() => {
    const n = !browserOnline.value ? 'offline' : network.value;
    if (n !== 'offline') void syncOutbox();
    if (lastNet !== null && lastNet !== n) announce(tr('conn.live.' + n));
    lastNet = n;
  });
}

/** Voice mode: read the main message of each screen aloud when it changes. */
function screenSpeech(s: Screen): [string, string, string | undefined] | null {
  const d = focusDet.value;
  if (s === 'home') {
    if (d && d.alertT !== null && t.value >= d.alertT) return ['alert', trr('al.voice'), 'alert-' + rail.value];
    return ['reg', trr('reg.voice'), 'reg-' + rail.value];
  }
  if (s === 'capture') return ['cap', tr('cap.title') + '. ' + tr('shot.wide.d'), undefined];
  if (s === 'packet') return ['pk', tr('pk.title') + '. ' + tr('pk.chainHelp'), undefined];
  if (s === 'file') return ['fl', trr('fl.intro'), undefined];
  if (s === 'status') return ['st', trr('st.note'), undefined];
  if (s === 'assist') return ['as', tr('as.intro'), undefined];
  if (s === 'helper') return ['hm', tr('hm.intro'), undefined];
  return null;
}

function FarmerNav() {
  const s = current.value;
  return (
    <nav class="f-nav" aria-label={tr('nav.farmer')}>
      {NAV.map(([id, icon, label]) => (
        <button key={id} type="button" aria-current={s === id ? 'page' : undefined} onClick={() => (screen.value = id)}>
          <Icon name={icon} />
          <span>{trr(label)}</span>
        </button>
      ))}
    </nav>
  );
}

/** The farmer's phone. `framed`: inside the 360×740 phone frame (own scroll, nav at the bottom). */
export function FarmerApp({ framed }: { framed?: boolean }) {
  const p = focusPlot.value, d = focusDet.value;
  const s = current.value;
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (framed) body.current?.scrollTo({ top: 0 });
    const h = body.current?.querySelector('h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    if (voiceMode.value) {
      const sp = screenSpeech(s);
      if (sp) say(sp[0], sp[1], langReady.value, sp[2]);
    } else stopVoice();
  }, [s]);

  // Alert arrival: announce it, and speak it when voice mode is on.
  const alerted = !!d && d.alertT !== null && t.value >= d.alertT;
  useEffect(() => {
    if (!alerted) return;
    announce(tr('al.title') + '. ' + tr('al.msg'));
    if (voiceMode.value && s === 'home') say('alert', trr('al.voice'), langReady.value, 'alert-' + rail.value);
  }, [alerted]);

  if (!p || !d) return null;
  // On the helper's queue the farmer tabs would open the demo farmer's screens, not a farmer in the queue: the queue is the
  // only way to a farmer, so the tabs are hidden there (audit H2).
  const nav = !(helperSession.value && activePlotId.value === null && s === 'helper');
  return (
    <section class={'farmer' + (framed ? ' framed' : '')} aria-label={tr('nav.farmer')} data-sim-numbers>
      <ConnStrip />
      {!storageOk.value && <p class="note note-warn" role="status" data-storage-warning><Icon name="info" /><span>{tr('db.memory')}</span></p>}
      {storageOk.value && storagePersistent.value === false && view.value.queued > 0 && <p class="note note-warn" role="status" data-persist-warning><Icon name="info" /><span>{tr('db.notPersistent')}</span></p>}
      <header class="f-top">
        <div class="f-who">
          <strong>{s === 'helper' ? tr('hm.title') : p.name}</strong>
          <span>{s === 'helper' ? tr('hm.sub') : `${p.id} · ${p.village}`}</span>
        </div>
        <button type="button" class="iconbtn" aria-label={tr('nav.settings')} onClick={() => (settingsOpen.value = true)} data-tour="settings">
          <Icon name="gear" />
        </button>
      </header>
      {!framed && nav && <FarmerNav />}
      {activePlotId.value !== null && s !== 'helper' && (
        <div class="hbar" role="group" aria-label={tr('hm.title')} data-helper-bar>
          <span class="hbar-t"><Icon name="users" size={18} /> {tr('hm.bar', { farmer: p.name, plot: p.id })}</span>
          <button type="button" class="pill pill-ghost pill-sm" onClick={backToQueue}>{tr('hm.back')}</button>
        </div>
      )}
      {rewound.value && (
        <p class="note note-plain f-rewound" role="status">
          <Icon name="reset" />
          <span>{tr('f.rewound')}</span>
          <button type="button" class="link-arrow" onClick={() => (rewound.value = false)}>{tr('f.ok')}</button>
        </p>
      )}
      <div class="f-body" ref={body}>
        <div class="f-screen" key={s}>
          {s === 'home' && <Home />}
          {s === 'capture' && <Capture />}
          {s === 'packet' && <Packet />}
          {s === 'file' && <FileClaim />}
          {s === 'status' && <Status />}
          {s === 'assist' && <Assist />}
          {s === 'helper' && <Helper />}
        </div>
      </div>
      {framed && nav && <FarmerNav />}
    </section>
  );
}

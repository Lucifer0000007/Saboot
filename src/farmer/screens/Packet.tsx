import { useState } from 'preact/hooks';
import { Icon } from '../../ui/Icon';
import { Val } from '../../ui/ProvTag';
import { lazy } from '../../lib/lazy';
import { tr, trr } from '../../lib/i18n';
import { fmtClock, fmtDur } from '../../lib/time';
import { short } from '../../lib/hash';
import { network } from '../../lib/prefs';
import { view, syncOutbox, busy, isOffline, GAP_FLAG_H, type Link, type FocusEvent } from '../focus';
import { SHOTS } from '../photo';
import { screen } from '../nav';
import { activePlotId, focusPlot } from '../../sim/engine';
import { backToQueue } from '../helper';
import { SyncLog } from '../SyncLog';
import { Thumb, sealOrSay } from './Capture';
import { Seal } from '../../ui/Seal';

const ShareSheet = lazy(() => import('../ShareToLaptop'), 0);

function ShareCard() {
  const [open, setOpen] = useState(false);
  return (
    <section class="share-card" aria-labelledby="share-h" data-tour="share">
      <h3 id="share-h"><Icon name="qr" /> {tr('k.title')}</h3>
      <p class="f-help">{tr('k.body')}</p>
      <button type="button" class="pill pill-ghost" onClick={() => setOpen(true)}><Icon name="qr" /> {tr('k.btn')}</button>
      {open && <ShareSheet onClose={() => setOpen(false)} />}
    </section>
  );
}

// typed by event type, so a new kind of event cannot reach the screen as a raw key (audit CC-04: 'objection' did)
const EV_LABEL: Record<FocusEvent['type'], string> = {
  shot: 'cap.taken', seal: 'pk.sealed', sync: 'pk.server', ref: 'fl.ref', no_damage: 'al.noDamage', consent: 'as.consent',
  objection: 'pk.evObjection',
};

function groups(h: string) {
  return h.match(/.{1,8}/g)!.join(' ');
}

export function Packet() {
  const v = view.value;
  const [msg, setMsg] = useState<string | null>(null);
  if (!v.shotCount) {
    return (
      <div class="stack f-stack">
        <h2 class="f-title">{tr('pk.title')}</h2>
        <p>{tr('pk.empty')}</p>
        <button type="button" class="pill pill-primary pill-lg pill-block" data-take-photos onClick={() => (screen.value = 'capture')}>
          <Icon name="camera" /> {tr('cap.title')} <span class="arrow" aria-hidden="true">→</span>
        </button>
        <SyncLog />
      </div>
    );
  }
  const gaps = SHOTS.map((k) => v.shots[k]).filter((s) => s && s.recvT !== null && s.recvT - s.simT > GAP_FLAG_H);
  const maxGap = gaps.reduce((a, s) => Math.max(a, s!.recvT! - s!.simT), 0);
  const first = v.shots.wide ?? Object.values(v.shots)[0]!;
  // where the photos came from: one label for each origin that is present, with how many
  const photoOrigins = (['live', 'sim'] as const)
    .map((o) => [o, SHOTS.filter((k) => v.shots[k] && (v.shots[k]!.synthetic ? 'sim' : 'live') === o).length] as const)
    .filter(([, n]) => n > 0);
  return (
    <div class="stack f-stack">
      <div class="pk-head">
        <Seal state={v.seal ? 'sealed' : 'open'} size={76} />
        <div>
          <h2 class="f-title">{tr('pk.title')}</h2>
          <span class={'tag ' + (v.seal ? 'tag-ok' : '')}><Icon name={v.seal ? 'lock' : 'info'} size={16} /> {v.seal ? tr('pk.sealed') : tr('pk.unsealed')}</span>
        </div>
      </div>

      <ul class="pk-photos" role="list">
        {SHOTS.filter((k) => v.shots[k]).map((k) => (
          <li key={k}>
            <Thumb id={v.shots[k]!.photoId} alt={tr('shot.' + k)} />
            <span>{tr('shot.' + k)}</span>
          </li>
        ))}
      </ul>

      <dl class="facts">
        <div><dt>{tr('f.nav.photos')}</dt><dd>{photoOrigins.map(([o, n]) => <Val key={o} kind="photo" prov={o}><span class="num">{n}</span></Val>)}</dd></div>
        {/* plain words for the farmer; the coordinates are in the technical details (audit F12). A real GPS fix is not
            compared with the fictional plot, so it does not claim to be at the plot. */}
        <div data-pk-loc><dt>{tr('pk.location')}</dt><dd><Val kind="loc" prov={first.geo.src === 'gps' ? 'live' : 'sim'}>{first.geo.src === 'gps' ? <>{tr('cap.gps', { acc: first.geo.acc })} · {tr('pk.notChecked')}</> : <>{tr('pk.atPlot', { plot: focusPlot.value!.id })} · {tr('cap.simGps')}</>}</Val></dd></div>
        {v.consent && <div data-captured-by><dt>{tr('pk.by')}</dt><dd>{tr('pk.byValue', { name: v.consent.helper, role: v.consent.role })}</dd></div>}
        <div><dt>{tr('pk.device')}</dt><dd class="num">{fmtClock(v.firstShotT!)} – {fmtClock(v.lastShotT!, false)}</dd></div>
        <div><dt>{tr('pk.server')}</dt><dd class="num">{v.syncedT !== null ? fmtClock(v.syncedT) : '—'}</dd></div>
      </dl>

      {v.queued > 0 ? (
        <div class="note note-plain" role="status">
          <Icon name="clock" /> <span>{tr('pk.queued', { n: v.queued })}</span>
          {!isOffline() && network.value === 'online' && <button type="button" class="pill pill-ghost pill-sm" onClick={syncOutbox}>{tr('pk.syncNow')}</button>}
        </div>
      ) : (
        v.syncedT !== null && <p class="note note-ok"><Icon name="okShape" /><span>{tr('pk.synced', { time: fmtClock(v.syncedT) })}</span></p>
      )}
      {gaps.length > 0 && <p class="note note-warn"><Icon name="flag" /><span>{tr('pk.gap', { gap: fmtDur(maxGap) })}</span></p>}

      {v.seal && <ShareCard />}

      <details class="pk-tech" data-pk-tech>
        <summary><Icon name="link" /> <span>{tr('pk.tech')}</span></summary>
        <div class="stack">
        <dl class="facts">
          {v.seal && <div class="full" data-tour="hash"><dt>{tr('pk.hash')} <span lang="en">(SHA-256)</span></dt><dd class="hash">{groups(v.seal.packetHash)}</dd></div>}
          <div class="full" data-pk-coords><dt>{tr('pk.coords')}</dt><dd><Val kind="loc" prov={first.geo.src === 'gps' ? 'live' : 'sim'}><span class="num">{first.geo.lat.toFixed(5)}, {first.geo.lon.toFixed(5)}</span></Val></dd></div>
        </dl>
        <SyncLog />
        <section class="chain" aria-labelledby="chain-h">
        <h3 id="chain-h"><Icon name="link" /> {tr('pk.chain')}</h3>
        <p class="f-help">{tr('pk.chainHelp')}</p>
        <ol role="list">
          {v.events.map((l: Link) => (
            <li key={l.hash}>
              <span class="seq num">#{l.seq + 1}</span>
              <span class="ev">{tr(EV_LABEL[l.body.type] ?? l.body.type)}{l.body.type === 'shot' ? ' · ' + tr('shot.' + l.body.data.kind) : ''}</span>
              <span class="when num">{fmtClock(l.body.simT, false)}</span>
              <span class="hash h">{short(l.hash, 8)}</span>
              <span class="hash p"><span class="sr-only">{tr('pk.prev')}: </span><span aria-hidden="true">← </span>{short(l.prev, 6)}</span>
            </li>
          ))}
        </ol>
        </section>
        </div>
      </details>

      {v.seal && activePlotId.value !== null ? (
        <button type="button" class="pill pill-primary pill-lg pill-block" onClick={backToQueue}>
          <Icon name="users" /> {tr('hm.next')} <span class="arrow" aria-hidden="true">→</span>
        </button>
      ) : v.seal ? (
        <button type="button" class="pill pill-primary pill-lg pill-block" onClick={() => (screen.value = 'file')}>
          <Icon name="file" /> {trr('pk.cta')} <span class="arrow" aria-hidden="true">→</span>
        </button>
      ) : (
        <>
          <button type="button" class="pill pill-primary pill-lg pill-block" disabled={busy.value} onClick={() => sealOrSay(setMsg)}>
            <Icon name="lock" /> {tr('cap.done')} <span class="arrow" aria-hidden="true">→</span>
          </button>
          {msg && <p class="note note-bad" role="alert" data-seal-fail><Icon name="barShape" /><span>{msg}</span></p>}
        </>
      )}
    </div>
  );
}

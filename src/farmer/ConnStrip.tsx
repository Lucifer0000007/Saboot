// Connection-state strip (feature I): Online / Weak (2G) / Offline with an icon and a text label,
// plus how many items are still waiting. The intelligence layer is a simulated server; this phone is real.
import { Icon, type IconName } from '../ui/Icon';
import { tr } from '../lib/i18n';
import { fmtClock } from '../lib/time';
import { network, browserOnline } from '../lib/prefs';
import { t } from '../sim/engine';
import { logs, reduce, sending } from './focus';

const ICON: Record<string, IconName> = { online: 'signal', weak: 'signalWeak', offline: 'plane' };

export function ConnStrip() {
  const state = !browserOnline.value ? 'offline' : network.value;
  // the phone's own queue: every farmer's log on it, not only the one on screen, so a helper back at the queue still sees
  // what is waiting for the network (audit H9)
  const all = Object.values(logs.value).map((c) => reduce(c, t.value));
  const waiting = all.reduce((n, v) => n + v.queued + v.bodyPending, 0);
  return (
    <div class={'f-strip net-' + state} data-tour="strip">
      <span class="num f-clock">{fmtClock(t.value, false)}</span>
      <span class="f-sim" data-sim-label>{tr('sim.tag')}</span>
      <span class="f-net">
        <Icon name={ICON[state]} size={16} />
        <span>{tr('conn.' + state)}</span>
      </span>
      <span class="f-queue">
        {sending.value > 0 && state !== 'offline' ? tr('conn.sending') : waiting > 0 ? tr('conn.waiting', { n: waiting }) : all.some((v) => v.items.length) ? tr('conn.allSent') : ''}
      </span>
    </div>
  );
}

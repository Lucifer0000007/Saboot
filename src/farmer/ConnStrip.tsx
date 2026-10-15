// Connection-state strip (feature I): Online / Weak (2G) / Offline with an icon and a text label,
// plus how many items are still waiting. The intelligence layer is a simulated server; this phone is real.
import { Icon, type IconName } from '../ui/Icon';
import { tr } from '../lib/i18n';
import { fmtClock } from '../lib/time';
import { network, browserOnline } from '../lib/prefs';
import { t } from '../sim/engine';
import { view, sending } from './focus';

const ICON: Record<string, IconName> = { online: 'signal', weak: 'signalWeak', offline: 'plane' };

export function ConnStrip() {
  const state = !browserOnline.value ? 'offline' : network.value;
  const v = view.value;
  const waiting = v.queued + v.bodyPending;
  return (
    <div class={'f-strip net-' + state} data-tour="strip">
      <span class="num f-clock">{fmtClock(t.value, false)}</span>
      <span class="f-sim" data-sim-label>{tr('sim.tag')}</span>
      <span class="f-net">
        <Icon name={ICON[state]} size={16} />
        <span>{tr('conn.' + state)}</span>
      </span>
      <span class="f-queue">
        {sending.value > 0 && state !== 'offline' ? tr('conn.sending') : waiting > 0 ? tr('conn.waiting', { n: waiting }) : v.items.length ? tr('conn.allSent') : ''}
      </span>
    </div>
  );
}

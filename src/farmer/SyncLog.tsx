// Sync log (feature I): every captured item with phone time, (simulated) server receipt time and the gap.
import { Icon, type IconName } from '../ui/Icon';
import { tr } from '../lib/i18n';
import { fmtClock, fmtDur } from '../lib/time';
import { view, GAP_FLAG_H, type SyncItem } from './focus';

type St = 'synced' | 'queued' | 'hash' | 'gap';
const META: Record<St, { cls: string; icon: IconName }> = {
  synced: { cls: 'tag-ok', icon: 'okShape' },
  queued: { cls: '', icon: 'clock' },
  hash: { cls: '', icon: 'signalWeak' },
  gap: { cls: 'tag-warn', icon: 'flag' },
};

export function itemStatus(it: SyncItem): St {
  if (it.recvT === null) return 'queued';
  if (it.recvT - it.deviceT > GAP_FLAG_H) return 'gap';
  if (it.bodyT === null) return 'hash';
  return 'synced';
}

export function SyncLog() {
  const items = view.value.items;
  return (
    <section class="synclog" aria-labelledby="sync-h" data-tour="synclog">
      <h3 id="sync-h">{tr('sync.title')}</h3>
      <p class="f-help">{tr('sync.help')}</p>
      {items.length === 0 ? (
        <p class="f-help">{tr('sync.empty')}</p>
      ) : (
        <ul class="sl" role="list">
          {items.map((it) => {
            const st = itemStatus(it);
            const m = META[st];
            return (
              <li key={it.id}>
                <div class="sl-top">
                  <strong>{it.kind === 'packet' ? tr('sync.packet') : tr('shot.' + it.kind)}</strong>
                  <span class={'tag ' + m.cls}><Icon name={m.icon} size={16} />{tr('sync.st.' + st)}</span>
                </div>
                <dl class="sl-times">
                  <div><dt>{tr('sync.device')}</dt><dd class="num">{fmtClock(it.deviceT, false)}</dd></div>
                  <div><dt>{tr('sync.server')}</dt><dd class="num">{it.recvT === null ? '—' : fmtClock(it.recvT, false)}</dd></div>
                  <div><dt>{tr('sync.gap')}</dt><dd class="num">{it.recvT === null ? '—' : fmtDur(it.recvT - it.deviceT)}</dd></div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

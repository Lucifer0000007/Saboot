// Evidence tier: colour + distinct shape + text label (never colour alone).
import { Icon, type IconName } from './Icon';
import type { Tier } from '../sim/evidence';

export const TIER_META: Record<Tier, { label: string; icon: IconName; cls: string }> = {
  supported: { label: 'Supported', icon: 'okShape', cls: 'tag-ok' },
  partial: { label: 'Partial', icon: 'halfShape', cls: 'tag-warn' },
  insufficient: { label: 'Insufficient', icon: 'barShape', cls: 'tag-bad' },
  none: { label: 'No event', icon: 'target', cls: '' },
};

/** `range` adds the 90% plausibility band, e.g. "Partial 41–63". */
export function TierBadge({ tier, range }: { tier: Tier; range?: [number, number] }) {
  const m = TIER_META[tier];
  return (
    <span class={'tag tier ' + m.cls}>
      <Icon name={m.icon} size={16} />
      {m.label}
      {range && tier !== 'none' && <small class="num">{`${Math.round(range[0] * 100)}⁠–⁠${Math.round(range[1] * 100)}`}</small>}
    </span>
  );
}

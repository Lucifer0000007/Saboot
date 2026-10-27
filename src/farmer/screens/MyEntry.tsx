// The farmer's own row on the officer's draft list (audit F10), so "if your entry looks wrong" has an entry to look at.
// Read from the same rows the console's draft list is built from. It shows whether the plot is listed, its evidence tier
// with the radar estimate's range, and whether the photos have arrived: never an amount, and never a decision. SIMULATED.
// A lazy chunk: it brings the console's evidence model, which the farmer's phone needs only on this card.
import { Icon } from '../../ui/Icon';
import { ProvTag } from '../../ui/ProvTag';
import { tr } from '../../lib/i18n';
import { fmtClock } from '../../lib/time';
import { bandPct, type Tier } from '../../sim/evidence';
import { focusPlot, tSlow } from '../../sim/engine';
import { rows } from '../../dashboard/state';

const TIER: Record<Tier, string> = { supported: 'ob.tier.supported', partial: 'ob.tier.partial', insufficient: 'ob.tier.insufficient', none: 'ob.notListed' };

export default function MyEntry() {
  const p = focusPlot.value!;
  const r = rows.value.find((x) => x.s.plot.id === p.id);
  const listed = !!r && r.e.tier !== 'none';
  const sync = r?.s.times.syncT ?? null;
  return (
    <div class="ob-entry" data-my-entry={listed ? 'listed' : 'not-listed'}>
      <div class="row-between">
        <strong>{tr('ob.mine')}</strong>
        <ProvTag prov="sim" />
      </div>
      <p>{tr(listed ? 'ob.listed' : 'ob.notListed', { plot: p.id })}</p>
      {listed && (
        <ul class="ob-facts" role="list">
          <li><Icon name="scale" size={18} /><span>{tr('ob.tier', { tier: tr(TIER[r!.e.tier]) })}</span></li>
          <li><Icon name="water" size={18} /><span>{tr('ob.share', { lo: bandPct(r!.e.floodShareLo), hi: bandPct(r!.e.floodShareHi) })}</span></li>
          <li><Icon name="camera" size={18} /><span>{sync !== null && sync <= tSlow.value ? tr('ob.photos', { time: fmtClock(sync) }) : tr('ob.noPhotos')}</span></li>
        </ul>
      )}
    </div>
  );
}

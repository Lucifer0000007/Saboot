import { Icon } from '../ui/Icon';
import { TierBadge } from '../ui/TierBadge';
import { fmtDur } from '../lib/time';
const fmtDurEn = (h: number) => fmtDur(h, true);
import { openPlot } from '../site/layout';
import { importedLabel } from '../k/imported';
import { stageLabel, flagLabel } from '../sim/cohort';
import { rows, importedRows, sorted, sortKey, tierFilter, type Row, type SortKey } from './state';
import { rail } from '../lib/prefs';
import { makeBundle, bundleJson } from '../k/bundle';
import { download } from '../lib/download';

const LANG: Record<string, string> = { en: 'EN', hi: 'HI', pa: 'PA' };

export const RowTier = ({ r }: { r: Row }) => <TierBadge tier={r.e.tier} range={[r.e.lo, r.e.hi]} />;

export function TimeLeft({ r }: { r: Row }) {
  const s = r.s;
  if (s.timeLeft === null) return <span class="muted">—</span>;
  if (s.stage === 'no-damage') return <span class="muted">Closed (no damage)</span>;
  const done = s.times.fileT !== null && (s.stage === 'filed' || s.stage === 'acknowledged');
  const pm = s.rail === 'pmfby';
  // the relief window is advice, so a plot that reached the officer is simply "shown": no verdict on timing
  if (done) return <span class="tl-ok"><Icon name="okShape" size={16} /> {pm ? 'Reported in time' : 'Shown to the officer'}</span>;
  if (s.timeLeft <= 0) return pm ? <span class="tl-bad"><Icon name="barShape" size={16} /> Window closed</span> : <span class="muted"><Icon name="info" size={16} /> Advice passed</span>;
  // same tones as the farmer's countdown: ink above 24 h, amber with a clock below it, plus a word under 6 h
  const left = s.timeLeft;
  return (
    <span class="tl">
      <span class={'num' + (left < 24 ? ' tl-warn' : '')}>{left < 24 && <Icon name="clock" size={16} />}{fmtDurEn(left)}</span>
      {left < 6 && <span class="tag tag-warn">{pm ? 'Last hours' : 'Capture soon'}</span>}
    </span>
  );
}

export function PlotList() {
  const filt = tierFilter.value;
  const list = sorted(rows.value.filter((r) => filt[r.e.tier]), sortKey.value);
  return (
    <section class="plist" aria-labelledby="plist-h">
      <div class="row-between">
        <h3 id="plist-h" class="h-sm">Ranked plots <span class="cnt num">{list.length}</span></h3>
        <label class="sortby">
          <span>Sort by</span>
          <select class="input" value={sortKey.value} onChange={(e) => (sortKey.value = (e.currentTarget as HTMLSelectElement).value as SortKey)}>
            <option value="priority">Review priority</option>
            <option value="timeLeft">Time left</option>
            <option value="tier">Evidence tier</option>
          </select>
        </label>
      </div>
      {list.length === 0 && importedRows.value.length === 0 ? (
        <p class="note note-plain"><Icon name="info" /><span>No plots match the filter yet. Play the replay or jump to “Trigger”.</span></p>
      ) : (
        <table class="rtable ptable">
          <caption class="sr-only">Plots ranked by {sortKey.value === 'priority' ? 'review priority' : sortKey.value === 'timeLeft' ? 'time left' : 'evidence tier'}</caption>
          <thead>
            <tr>
              <th scope="col">Plot</th>
              <th scope="col">Farmer</th>
              <th scope="col">Stage</th>
              <th scope="col">{rail.value === 'pmfby' ? 'Time left' : 'Advice left'}</th>
              <th scope="col">Evidence tier</th>
              <th scope="col">Priority</th>
            </tr>
          </thead>
          <tbody>
            {importedRows.value.map((r) => (
              <tr key={'imp-' + r.k.head} class="imported" data-tour="imported">
                <td data-l="Plot">
                  <button type="button" class="plink" onClick={() => (openPlot.value = r.s.plot.id)} aria-label={`Open ${r.s.plot.id} details`}>{r.s.plot.id} <Icon name="arrow" size={16} /></button>
                  <span class="tag imported-tag"><Icon name="scan" size={16} />{importedLabel(r.k)}</span>
                </td>
                <td data-l="Farmer">{r.s.plot.name}<span class="sub">signed on the judge’s phone</span></td>
                <td data-l="Stage">Evidence received · integrity verified<span class="sub num">{r.k.shots.length} photo fingerprints · chain {r.k.head.slice(0, 10)}…</span>
                  <button type="button" class="pill pill-ghost pill-sm" data-export-bundle onClick={() => download(`saboot-evidence-${r.k.plot}.json`, bundleJson(makeBundle(r.k.code, r.k)), 'application/json')}><Icon name="download" size={16} /> Export bundle</button>
                </td>
                <td data-l="Time left"><TimeLeft r={r} /></td>
                <td data-l="Tier"><RowTier r={r} /></td>
                <td data-l="Priority"><span class="pri num" style={{ '--p': r.pri } as Record<string, number>}>{r.pri}</span></td>
              </tr>
            ))}
            {list.map((r) => {
              const p = r.s.plot;
              const flags = r.s.flags.filter((f) => f !== 'tall-crop');
              return (
                <tr key={p.id} class={(openPlot.value === p.id ? 'sel ' : '') + (r.s.persona === 'focus' ? 'focus' : '')}>
                  <td data-l="Plot">
                    <button type="button" class="plink" onClick={() => (openPlot.value = p.id)} aria-label={`Open ${p.id} details`}>
                      {p.id} <Icon name="arrow" size={16} />
                    </button>
                    <span class="sub">{p.village} · {p.crop}</span>
                  </td>
                  <td data-l="Farmer">
                    {p.name} <span class="lang-code">{LANG[p.lang]}</span>
                    {r.s.persona === 'focus' && <span class="tag you">You</span>}
                  </td>
                  <td data-l="Stage">
                    {stageLabel(r.s)}
                    {flags.length > 0 && (
                      <span class="flags">
                        {flags.map((f) => <span key={f} class="flag"><Icon name="flag" size={14} />{flagLabel(f, r.s.rail)}</span>)}
                      </span>
                    )}
                  </td>
                  <td data-l="Time left"><TimeLeft r={r} /></td>
                  <td data-l="Tier"><RowTier r={r} /></td>
                  <td data-l="Priority"><span class="pri num" style={{ '--p': r.pri } as Record<string, number>}>{r.pri}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

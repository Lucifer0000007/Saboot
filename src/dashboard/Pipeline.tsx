// Feature J: the claim pipeline with the human in the loop. Saboot assembles evidence; the farmer files;
// the insurer reviews; an officer decides — outside Saboot, which never sees or makes that decision.
import { Icon, type IconName } from '../ui/Icon';
import type { PlotState } from '../sim/cohort';
import { rows } from './state';
import { rail } from '../lib/prefs';

type StageId = 'assembled' | 'filed' | 'review' | 'decision';
type Stage = { id: StageId; who: string; label: string; icon: IconName };
const STAGES: Record<'relief' | 'pmfby', Stage[]> = {
  pmfby: [
    { id: 'assembled', who: 'Saboot', label: 'Evidence assembled', icon: 'shield' },
    { id: 'filed', who: 'Farmer', label: 'Filed by farmer', icon: 'file' },
    { id: 'review', who: 'Insurer', label: 'Insurer review', icon: 'list' },
    { id: 'decision', who: 'Officer', label: 'Officer decision', icon: 'gavel' },
  ],
  relief: [
    { id: 'assembled', who: 'Saboot', label: 'Evidence assembled', icon: 'shield' },
    { id: 'filed', who: 'Farmer', label: 'Shown to the officer', icon: 'file' },
    { id: 'review', who: 'Officer', label: 'Officer review', icon: 'list' },
    { id: 'decision', who: 'Department', label: 'Officer decision', icon: 'gavel' },
  ],
};

/** Furthest pipeline stage a plot has reached (null = no evidence yet). */
export function pipelineStage(s: PlotState): StageId | null {
  if (s.stage === 'acknowledged') return 'review';
  if (s.stage === 'filed') return 'filed';
  if (s.stage === 'evidence') return 'assembled';
  return null;
}

function counts() {
  const c: Record<StageId, number> = { assembled: 0, filed: 0, review: 0, decision: 0 };
  for (const r of rows.value) {
    const st = pipelineStage(r.s);
    if (st === 'review') { c.review++; c.filed++; c.assembled++; }
    else if (st === 'filed') { c.filed++; c.assembled++; }
    else if (st === 'assembled') c.assembled++;
  }
  return c;
}

/** Cohort view (`s` omitted) shows how many plots reached each stage; plot view highlights one plot. */
export function Pipeline({ s }: { s?: PlotState }) {
  const c = s ? null : counts();
  const reached = s ? pipelineStage(s) : null;
  const order: StageId[] = ['assembled', 'filed', 'review', 'decision'];
  const idx = reached ? order.indexOf(reached) : -1;
  return (
    <figure class="pipe" aria-labelledby={s ? 'pipe-h-' + s.plot.id : 'pipe-h'} data-tour="pipeline" data-sim-numbers={c ? true : undefined}>
      <figcaption class="pipe-cap">
        <span id={s ? 'pipe-h-' + s.plot.id : 'pipe-h'} class="eyebrow">{rail.value === 'relief' ? 'Assessment pipeline' : 'Claim pipeline'} · human in the loop</span>
        {c && <span class="tag tag-sim" data-sim-label><span class="dot" aria-hidden="true" />Simulated counts</span>}
      </figcaption>
      <ol class="pipe-row" role="list">
        {STAGES[rail.value].map((st, i) => {
          const outside = st.id === 'decision';
          const done = s ? i <= idx : false;
          return (
            <li key={st.id} class={'pipe-node' + (outside ? ' outside' : '') + (done ? ' done' : '')}>
              <span class="pipe-who">{st.who}</span>
              <span class="pipe-pill">
                <Icon name={st.icon} size={16} />
                <span>{st.label}</span>
              </span>
              {outside ? (
                <span class="pipe-note"><strong>Decision happens outside Saboot.</strong> Saboot never sees or makes it.</span>
              ) : c ? (
                <span class="pipe-count"><strong class="num">{c[st.id]}</strong> plots</span>
              ) : (
                <span class="pipe-count">{done ? 'Reached' : 'Not yet'}</span>
              )}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

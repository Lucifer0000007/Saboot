// How it works: architecture diagram (pill nodes, thin curved connectors, mint glow behind the hub),
// the five-step workflow and the real-vs-simulated table. Translated; the diagram is HTML so labels in
// any language wrap instead of overflowing, and it re-flows to a vertical layout on phones.
import '../styles/console.css';
import '../styles/how.css';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon, type IconName } from '../ui/Icon';
import { tr, trr, langReady } from '../lib/i18n';
import { PMFBY } from '../config';
import { SCENARIO } from '../generated/scenario-summary';

type NodeId = 'src' | 'det' | 'pl' | 'clk' | 'al' | 'cap' | 'pk' | 'ins' | 'tri' | 'fil' | 'aud';
const GROUPS: { id: string; label: string; nodes: [NodeId, IconName][] }[] = [
  { id: 'server', label: 'arch.server', nodes: [['src', 'satellite'], ['det', 'scale'], ['pl', 'layers'], ['clk', 'clock']] },
  { id: 'phone', label: 'arch.phone', nodes: [['al', 'phone'], ['cap', 'camera'], ['pk', 'shield']] },
  { id: 'out', label: 'arch.out', nodes: [['ins', 'map'], ['tri', 'list'], ['fil', 'file'], ['aud', 'link']] },
];
const EDGES: [NodeId, NodeId][] = [
  ['src', 'det'], ['det', 'pl'], ['pl', 'clk'], ['clk', 'al'], ['al', 'cap'], ['cap', 'pk'],
  ['pk', 'ins'], ['pk', 'tri'], ['pk', 'fil'], ['pk', 'aud'],
];

/** Thin curved connectors measured from the laid-out pills (so any language and any width works). */
function Connectors({ box }: { box: { current: HTMLDivElement | null } }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const root = box.current;
    if (!root) return;
    const draw = () => {
      const o = root.getBoundingClientRect();
      const r = (id: NodeId) => root.querySelector(`[data-node="${id}"] .an-pill`)!.getBoundingClientRect();
      const out: string[] = [];
      for (const [a, b] of EDGES) {
        const A = r(a), B = r(b);
        const ax = A.left - o.left, ay = A.top - o.top, bx = B.left - o.left, by = B.top - o.top;
        if (B.top >= A.bottom - 2) {
          // b is below a: run down the left gutter (captions are indented past it)
          const x1 = ax + 14, y1 = ay + A.height, x2 = bx + 14, y2 = by;
          const k = Math.max(16, (y2 - y1) / 2);
          out.push(`M${x1} ${y1}C${x1} ${y1 + k} ${x2} ${y2 - k} ${x2} ${y2}`);
        } else {
          // side by side: leave from the right, enter from the left
          const x1 = ax + A.width, y1 = ay + A.height / 2, x2 = bx, y2 = by + B.height / 2;
          const k = Math.max(16, (x2 - x1) / 2);
          out.push(`M${x1} ${y1}C${x1 + k} ${y1} ${x2 - k} ${y2} ${x2} ${y2}`);
        }
      }
      setSize({ w: o.width, h: o.height });
      setPaths(out);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(root);
    return () => ro.disconnect();
  }, [langReady.value]);
  return (
    <svg class="arch-lines" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true" focusable="false">
      {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#cecac8" stroke-width="1" />)}
    </svg>
  );
}

function Architecture() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <figure class="arch" aria-labelledby="arch-cap" data-tour="arch">
      <div class="arch-grid" ref={box}>
        <Connectors box={box} />
        {GROUPS.map((g) => (
          <div key={g.id} class={'arch-group g-' + g.id}>
            <p class="eyebrow arch-label">{tr(g.label)}</p>
            <ol class="arch-nodes" role="list">
              {g.nodes.map(([id, icon]) => (
                <li key={id} class={'arch-node' + (id === 'pk' ? ' hub' : '')} data-node={id}>
                  {id === 'pk' && <span class="glow" aria-hidden="true" />}
                  <span class="an-pill"><Icon name={icon} size={12} /><span>{trr('arch.' + id)}</span></span>
                  <span class="an-sub">{trr('arch.' + id + '.s')}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <figcaption id="arch-cap" class="muted">{trr('arch.caption')}</figcaption>
    </figure>
  );
}

const STEPS: IconName[] = ['satellite', 'phone', 'camera', 'shield', 'file'];
type Status = 'real' | 'sim' | 'mixed' | 'none';
const REAL: [Status, number][] = [
  ['sim', 1], ['sim', 14], ['sim', 2], ['sim', 3], ['sim', 4], ['real', 5], ['mixed', 6], ['real', 7], ['real', 8], ['mixed', 9], ['mixed', 10], ['sim', 11], ['mixed', 12], ['sim', 13], ['none', 15],
];
const STATUS: Record<Status, [string, string]> = { real: ['tag-ok', 'rs.real'], sim: ['', 'rs.sim'], mixed: ['tag-warn', 'rs.mixed'], none: ['', 'rs.none'] };
/** Counts quoted in the table come from the scenario by `npm run gen`, never typed here. */
const ROW_VARS: Record<number, Record<string, number>> = {
  1: { n: SCENARIO.rainGauges },
  2: { n: SCENARIO.radarCadenceHours, slow: SCENARIO.radarSlowCadenceHours },
  4: { n: SCENARIO.plots },
  14: { n: SCENARIO.riverGauges },
};
const statusIcon = (s: Status) => (s === 'real' ? 'okShape' : s === 'sim' ? 'target' : s === 'none' ? 'barShape' : 'halfShape');

export default function HowItWorks() {
  useEffect(() => {
    // deep link #how lands here once the chunk has rendered
    if (location.hash === '#how') document.getElementById('how')?.scrollIntoView();
  }, []);
  return (
    <div class="how-body">
      <div class="sec-head">
        <p class="eyebrow">{tr('how.eyebrow')}</p>
        <h2 id="how-h">{tr('how.h')}</h2>
        <p class="lede">{tr('how.lead')}</p>
      </div>
      <Architecture />
      <div class="how-notes">
        <p class="note note-plain"><Icon name="phone" /><span>{tr('how.local')}</span></p>
        <p class="note note-plain"><Icon name="map" /><span>{trr('how.model', { state: PMFBY.state })}</span></p>
      </div>
      <section aria-labelledby="wf-h" class="how-block">
        <h3 id="wf-h" class="h-sm">{tr('wf.h')}</h3>
        <ol class="workflow" role="list">
          {STEPS.map((icon, i) => (
            <li key={i} class="card">
              <span class="wf-n num" aria-hidden="true">{i + 1}</span>
              <Icon name={icon} />
              <h4>{trr(`wf.${i + 1}.t`)}</h4>
              <p>{trr(`wf.${i + 1}.b`)}</p>
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="rs-h" class="how-block">
        <h3 id="rs-h" class="h-sm">{tr('rs.h')}</h3>
        <table class="rtable rs-table">
          <caption class="sr-only">{tr('rs.h')}</caption>
          <thead>
            <tr><th scope="col">{tr('rs.c')}</th><th scope="col">{tr('rs.demo')}</th><th scope="col">{tr('rs.status')}</th><th scope="col">{tr('rs.prod')}</th></tr>
          </thead>
          <tbody>
            {REAL.map(([s, n]) => (
              <tr key={n}>
                <th scope="row">{trr(`rs.${n}.c`)}</th>
                <td data-l={tr('rs.demo')}>{trr(`rs.${n}.d`, ROW_VARS[n])}</td>
                <td data-l={tr('rs.status')}><span class={'tag ' + STATUS[s][0]}><Icon name={statusIcon(s)} size={16} />{tr(STATUS[s][1])}</span></td>
                <td data-l={tr('rs.prod')}>{trr(`rs.${n}.p`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

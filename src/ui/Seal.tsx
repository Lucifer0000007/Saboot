// The lac seal (docs/DESIGN.md, "The seal"): the one bold element. Open (dashed ring), sealed (a lac disc), verified
// (a khet ring and a tick) and broken (the disc cracks in two, a lal ring). Colours come from tokens via CSS classes, so
// the seal follows light, dark and high contrast. Decorative unless `label` is given.
import { useId } from 'preact/hooks';

export type SealState = 'open' | 'sealed' | 'verified' | 'broken';

// A scalloped rim: 18 lobes around the centre of a 120 unit box. Computed once, the same on the server and the client.
const LOBES = 18;
const rim = (() => {
  const pt = (a: number, r: number) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
  let d = `M${pt(0, 50)}`;
  for (let i = 0; i < LOBES; i++) {
    const a0 = (i / LOBES) * 2 * Math.PI;
    const a1 = ((i + 1) / LOBES) * 2 * Math.PI;
    d += `Q${pt((a0 + a1) / 2, 57)} ${pt(a1, 50)}`;
  }
  return d + 'Z';
})();
// The crack runs top to bottom in a zigzag; each half of the disc is clipped to one side of it.
const CRACK = 'M58 0L64 22L55 40L66 58L54 77L63 96L57 120';
const LEFT = `${CRACK}H0V0Z`;
const RIGHT = `${CRACK}H120V0Z`;

function Body() {
  return (
    <>
      <path class="seal-body" d={rim} />
      <circle class="seal-ring" cx="60" cy="60" r="38" />
      <circle class="seal-ring seal-ring-in" cx="60" cy="60" r="31" />
    </>
  );
}

export function Seal({ state, size = 96, label, class: cls }: { state: SealState; size?: number; label?: string; class?: string }) {
  const id = useId();
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': 'true' as const };
  return (
    <svg class={'seal' + (cls ? ' ' + cls : '')} data-seal={state} width={size} height={size} viewBox="-8 -8 136 136" focusable="false" {...a11y}>
      {state === 'open' ? (
        <>
          <circle class="seal-open" cx="60" cy="60" r="52" />
          <path class="seal-mark-open" d="M48 58v-8a12 12 0 0 1 24 0M44 58h32v22H44z" />
        </>
      ) : state === 'broken' ? (
        <>
          <defs>
            <clipPath id={id + 'l'}><path d={LEFT} /></clipPath>
            <clipPath id={id + 'r'}><path d={RIGHT} /></clipPath>
          </defs>
          <g class="seal-half seal-l" clip-path={`url(#${id}l)`}><Body /></g>
          <g class="seal-half seal-r" clip-path={`url(#${id}r)`}><Body /></g>
          <path class="seal-crack" d={CRACK} />
          <circle class="seal-halo seal-halo-bad" cx="60" cy="60" r="64" />
        </>
      ) : (
        <>
          <Body />
          {/* the mark pressed into the lac: a lock when sealed, a tick once a checker has recomputed it */}
          {state === 'sealed'
            ? <path class="seal-mark" d="M50 57v-7a10 10 0 0 1 20 0v7M46 57h28v20H46zM60 64v6" />
            : <path class="seal-mark" d="M45 61l10 10 20-22" />}
          {state === 'verified' && <circle class="seal-halo seal-halo-ok" cx="60" cy="60" r="64" />}
        </>
      )}
    </svg>
  );
}

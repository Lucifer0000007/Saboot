// Deterministic synthetic evidence photos for the scripted cohort (small inline SVG, clearly labelled).
import type { Plot } from '../sim/model';

export type Kind = 'wide' | 'close' | 'landmark';

export function cohortPhotoSvg(p: Plot, kind: Kind, offPlot = false): string {
  let s = p.idx * 7919 + kind.length * 104729;
  const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const hz = kind === 'close' ? 26 : 50;
  let rows = '';
  const n = kind === 'close' ? 5 : 10;
  for (let i = 0; i < n; i++) {
    const y = hz + 6 + ((120 - hz) * (i + 0.5)) / n;
    const k = kind === 'close' ? 3 : 0.6 + i / n;
    for (let x = 2; x < 160; x += 9 * k) {
      const l = (r() - 0.5) * 4 * k;
      rows += `M${x.toFixed(1)} ${y.toFixed(1)}l${l.toFixed(1)} ${(-7 * k).toFixed(1)}`;
    }
  }
  const lm = kind === 'landmark' ? `<rect x="98" y="${hz - 22}" width="36" height="30" fill="#b9a58a"/><path d="M94 ${hz - 22}l22-13 22 13z" fill="#7d4b35"/>` : '';
  const water = offPlot ? '#a8b59a' : '#8fa6aa';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="${hz}" fill="#bfc5c3"/><path d="M0 ${hz}h160" stroke="#4d5b46" stroke-width="6"/><rect y="${hz}" width="160" height="${120 - hz}" fill="${water}"/><path d="${rows}" stroke="#4f7a3a" stroke-width="1.4"/>${lm}<rect y="106" width="160" height="14" fill="#1c1e19" opacity=".75"/><text x="5" y="116" font-size="8" fill="#fffdf7" font-family="sans-serif">SIMULATED · ${p.id} · ${kind}</text></svg>`;
}

export const svgUrl = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

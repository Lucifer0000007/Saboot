// Hand-written SVG charts (no chart library).
import type { Model, Plot } from '../sim/model';
import { sarFrac, sarExcess } from '../sim/model';
import { fmtT } from '../lib/time';

const W = 340, H = 160, PL = 30, PR = 34, PT = 12, PB = 24;

/** Hourly rain bars + trailing-24 h accumulation vs thresholds, drawn only up to "now". */
export function RainChart({ m, station, t, eventT, title }: { m: Model; station: number; t: number; eventT: number | null; title?: string }) {
  const st = m.stations[station];
  const th = m.raw.thresholds;
  const hours = m.raw.hours;
  const now = Math.min(hours, Math.floor(t));
  const x = (h: number) => PL + ((W - PL - PR) * h) / hours;
  const maxMM = 20, maxAcc = 200;
  const yb = (mm: number) => H - PB - ((H - PT - PB) * Math.min(mm, maxMM)) / maxMM;
  const ya = (mm: number) => H - PB - ((H - PT - PB) * Math.min(mm, maxAcc)) / maxAcc;
  let bars = '';
  for (let h = 0; h <= now; h++) {
    const v = st.mm[h];
    if (v > 0.05) bars += `M${x(h).toFixed(1)} ${yb(0)}V${yb(v).toFixed(1)}`;
  }
  let line = '';
  for (let h = 0; h <= now; h++) line += (h ? 'L' : 'M') + x(h).toFixed(1) + ' ' + ya(st.r24[h]).toFixed(1);
  const peak = Math.max(...Array.from(st.r24.slice(0, now + 1)));
  return (
    <figure class="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title ?? 'Rainfall'} at ${st.id}: peak 24-hour total ${peak.toFixed(0)} mm so far; heavy-rain line ${th.rain24} mm. Simulated data.`}>
        {[0, 24, 48, 72, 96, 120, 144, 168].map((h) => (
          <g key={h}>
            <path d={`M${x(h)} ${PT}V${H - PB}`} stroke="var(--rule)" />
            <text x={x(h)} y={H - 6} text-anchor="middle" class="ax">{h / 24}d</text>
          </g>
        ))}
        <path d={`M${PL} ${ya(th.rain24)}H${W - PR}`} stroke="var(--warn)" stroke-dasharray="4 3" stroke-width="1.5" />
        <text x={W - PR + 2} y={ya(th.rain24) + 3} class="ax">{th.rain24}</text>
        <path d={`M${PL} ${ya(th.rainHeavy)}H${W - PR}`} stroke="var(--bad)" stroke-dasharray="2 3" stroke-width="1.2" />
        <text x={W - PR + 2} y={ya(th.rainHeavy) + 3} class="ax">{th.rainHeavy}</text>
        <path d={bars} stroke="var(--water)" stroke-width="1.8" />
        <path d={line} fill="none" stroke="var(--kali)" stroke-width="1.6" />
        {eventT !== null && eventT <= t && (
          <g>
            <path d={`M${x(eventT)} ${PT}V${H - PB}`} stroke="var(--warn)" stroke-width="1.5" />
            <text x={x(eventT) + 3} y={PT + 11} class="ax">event</text>
          </g>
        )}
        <path d={`M${x(Math.min(t, hours))} ${PT}V${H - PB}`} stroke="var(--kali)" stroke-width="1.2" />
        <text x={PL - 4} y={yb(maxMM) + 4} text-anchor="end" class="ax">20</text>
        <text x={PL - 4} y={yb(0)} text-anchor="end" class="ax">0</text>
      </svg>
      <figcaption>
        <span class="key bars" /> mm/h · <span class="key acc" /> 24 h total (mm) · <span class="key thr" /> {th.rain24} mm heavy-rain line · now {fmtT(t)}
      </figcaption>
    </figure>
  );
}

/**
 * Observed water share of a plot at each processed radar pass. For paddy in the standing-water season the radar sees
 * its baseline water anyway: the dotted line marks it, and a bar is dark only when the water ABOVE that baseline
 * reaches the flood share.
 */
export function SarSpark({ m, p, t }: { m: Model; p: Plot; t: number }) {
  const passes = m.sar.filter((s) => s + 1 <= t);
  const w = 340, h = 84, pad = 20;
  const x = (i: number) => pad + ((w - 2 * pad) * i) / Math.max(1, m.sar.length - 1);
  const y = (f: number) => h - pad - (h - 2 * pad) * f;
  const th = m.raw.thresholds.floodFrac;
  const base = p.baseWater;
  const thr = base > 0 ? base + th * (1 - base) : th;
  const latest = passes.length ? Math.round(sarFrac(p, passes[passes.length - 1]) * 100) : 0;
  return (
    <svg class="spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Simulated radar: water seen on the plot at ${passes.length} processed passes; latest ${latest}%${base > 0 ? `. Paddy in the standing-water season: the radar sees about ${Math.round(base * 100)}% water anyway` : ''}`}>
      <path d={`M${pad} ${y(thr)}H${w - pad}`} stroke="var(--warn)" stroke-dasharray="4 3" />
      {base > 0 && <path d={`M${pad} ${y(base)}H${w - pad}`} stroke="var(--rule-strong)" stroke-dasharray="1 3" stroke-width="1.5" />}
      {m.sar.map((s, i) => {
        const done = s + 1 <= t;
        const f = sarFrac(p, s);
        return (
          <g key={s}>
            <rect x={x(i) - 6} y={done ? y(f) : y(0) - 2} width="12" height={done ? Math.max(2, y(0) - y(f)) : 2} rx="2" fill={done ? (sarExcess(p, s) >= th ? 'var(--kali)' : 'var(--water)') : 'var(--rule)'} />
            {i % 2 === 0 && <text x={x(i)} y={h - 4} text-anchor="middle" class="ax">{s}h</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** River gauges that serve a plot: the stage up to now against the danger level (Rule C). */
export function RiverChart({ m, p, t }: { m: Model; p: Plot; t: number }) {
  const gauges = p.reach.map((r) => m.gauges.find((g) => g.id === r.gauge)).filter((g): g is NonNullable<typeof g> => !!g);
  if (!gauges.length) return null;
  const hours = m.raw.hours;
  const now = Math.min(hours, Math.floor(t));
  const unit = gauges[0].unit;
  const top = Math.max(...gauges.flatMap((g) => [g.danger, ...Array.from(g.series)]));
  const maxV = Math.ceil((top * 1.08) / 100) * 100;
  const x = (hh: number) => PL + ((W - PL - PR) * hh) / hours;
  const y = (v: number) => H - PB - ((H - PT - PB) * Math.min(v, maxV)) / maxV;
  const dash = ['', '5 3', '2 3'];
  const danger = gauges[0].danger;
  return (
    <figure class="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`River stage at ${gauges.map((g) => g.id).join(' and ')}, danger level ${danger} ${unit}. Simulated data.`}>
        {[0, 24, 48, 72, 96, 120, 144, 168].map((hh) => (
          <g key={hh}>
            <path d={`M${x(hh)} ${PT}V${H - PB}`} stroke="var(--rule)" />
            <text x={x(hh)} y={H - 6} text-anchor="middle" class="ax">{hh / 24}d</text>
          </g>
        ))}
        <path d={`M${PL} ${y(danger)}H${W - PR}`} stroke="var(--bad)" stroke-dasharray="2 3" stroke-width="1.2" />
        <text x={W - PR + 2} y={y(danger) + 3} class="ax">{danger}</text>
        {gauges.map((g, i) => {
          let d = '';
          for (let hh = 0; hh <= now; hh++) d += (hh ? 'L' : 'M') + x(hh).toFixed(1) + ' ' + y(g.series[hh]).toFixed(1);
          return <path key={g.id} d={d} fill="none" stroke={i ? 'var(--kali-2)' : 'var(--kali)'} stroke-width="1.6" stroke-dasharray={dash[i]} />;
        })}
        <path d={`M${x(Math.min(t, hours))} ${PT}V${H - PB}`} stroke="var(--kali)" stroke-width="1.2" />
        <text x={PL - 4} y={y(maxV) + 4} text-anchor="end" class="ax">{maxV}</text>
        <text x={PL - 4} y={y(0)} text-anchor="end" class="ax">0</text>
      </svg>
      <figcaption>
        {gauges.map((g, i) => (
          <span key={g.id}>
            <svg width="22" height="8" aria-hidden="true"><path d="M1 4h20" stroke={i ? 'var(--kali-2)' : 'var(--kali)'} stroke-width="2" stroke-dasharray={dash[i]} /></svg> {g.id} ({unit}){' · '}
          </span>
        ))}
        <span class="key thr" /> danger {danger} {unit} · now {fmtT(t)}
      </figcaption>
    </figure>
  );
}

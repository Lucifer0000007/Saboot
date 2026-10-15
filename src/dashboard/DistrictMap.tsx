// Hand-drawn SVG district map: plots filled AND hatched by evidence tier, flood extent from the latest
// simulated SAR pass, legend + filter, pan/zoom buttons, and labels that never render below 12px.
import { signal } from '@preact/signals';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { TIER_META } from '../ui/TierBadge';
import { model, tSlow } from '../sim/engine';
import { floodPath, lowlandPath } from '../sim/model';
import { lastPassBefore, type Tier } from '../sim/evidence';
import { stageLabel } from '../sim/cohort';
import { fmtT } from '../lib/time';
import { openPlot } from '../site/layout';
import { rows, importedRows, tierFilter, layers, type Row } from './state';

/** Fill = status tint, hatch = status ink: colour is never the only signal. Rendered once per panel. */
export function MapDefs() {
  return (
    <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="pat-supported" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#e4eee8" />
          <path d="M0 0v6" stroke="#1f6b4a" stroke-width="1.4" />
        </pattern>
        <pattern id="pat-partial" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f3e8cf" />
          <circle cx="3" cy="3" r="1.2" fill="#8a5a00" />
        </pattern>
        <pattern id="pat-insufficient" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#f4e1db" />
          <path d="M0 0l6 6M6 0l-6 6" stroke="#b3402a" stroke-width="1" />
        </pattern>
        <pattern id="pat-low" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <path d="M0 0v8" stroke="#797776" stroke-width="0.8" opacity=".5" />
        </pattern>
      </defs>
    </svg>
  );
}

export const tierPaint = (t: Tier) => (t === 'none' ? '#f6f3f1' : `url(#pat-${t})`);

const view = signal<{ z: number; cx: number; cy: number }>({ z: 1, cx: 0.5, cy: 0.5 });
const ZOOMS = [1, 1.5, 2, 3];

/** Rendered px per SVG unit, so labels can be sized to >= 12px on screen. */
function useScale(ref: { current: Element | null }, units: number) {
  const [k, setK] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.getBoundingClientRect().width / units));
    ro.observe(el);
    return () => ro.disconnect();
  }, [units]);
  return k;
}

export function DistrictMap() {
  const m = model.value!;
  const t = tSlow.value;
  const pass = lastPassBefore(m, t);
  const flood = useMemo(() => (pass === null ? '' : floodPath(m, pass)), [m, pass]);
  const low = useMemo(() => lowlandPath(m), [m]);
  const lay = layers.value;
  const filt = tierFilter.value;
  const sel = openPlot.value;
  const hz = m.raw.hail;
  const { w: W, h: H } = m.raw.map;
  const svg = useRef<SVGSVGElement>(null);
  const v = view.value;
  const vw = W / v.z, vh = H / v.z;
  const vx = Math.max(0, Math.min(W - vw, v.cx * W - vw / 2));
  const vy = Math.max(0, Math.min(H - vh, v.cy * H - vh / 2));
  const k = useScale(svg, vw) ;
  const fs = (px: number) => px / Math.max(0.01, k); // font size in SVG units for `px` on screen
  const small = k * v.z < 0.75; // tight: hide secondary labels (they are listed in the legend instead)
  const select = (r: Row) => (openPlot.value = r.s.plot.id);
  const zoom = (dir: 1 | -1) => {
    const i = Math.max(0, Math.min(ZOOMS.length - 1, ZOOMS.indexOf(v.z) + dir));
    view.value = { ...v, z: ZOOMS[i] };
  };
  const pan = (dx: number, dy: number) => (view.value = { ...v, cx: Math.max(0, Math.min(1, v.cx + dx / v.z)), cy: Math.max(0, Math.min(1, v.cy + dy / v.z)) });
  return (
    <figure class="map" data-tour="map">
      <div class="map-ctl" role="group" aria-label="Map zoom and pan">
        <button type="button" class="iconbtn" aria-label="Zoom in" onClick={() => zoom(1)} disabled={v.z === ZOOMS[ZOOMS.length - 1]}><Icon name="zoomIn" /></button>
        <button type="button" class="iconbtn" aria-label="Zoom out" onClick={() => zoom(-1)} disabled={v.z === 1}><Icon name="zoomOut" /></button>
        {v.z > 1 && (
          <>
            <button type="button" class="iconbtn" aria-label="Pan left" onClick={() => pan(-0.2, 0)}><Icon name="left" /></button>
            <button type="button" class="iconbtn" aria-label="Pan right" onClick={() => pan(0.2, 0)}><Icon name="right" /></button>
            <button type="button" class="iconbtn" aria-label="Pan up" onClick={() => pan(0, -0.2)}><Icon name="down" class="rot180" /></button>
            <button type="button" class="iconbtn" aria-label="Pan down" onClick={() => pan(0, 0.2)}><Icon name="down" /></button>
            <button type="button" class="iconbtn" aria-label="Reset map view" onClick={() => (view.value = { z: 1, cx: 0.5, cy: 0.5 })}><Icon name="reset" /></button>
          </>
        )}
      </div>
      <div class="map-frame">
        <svg ref={svg} viewBox={`${vx} ${vy} ${vw} ${vh}`} role="group" aria-label={`District map, ${m.raw.district}. Plots are buttons; Enter opens details.`}>
          <path d={m.raw.map.boundary} fill="#fbfaf9" stroke="#797776" stroke-width="1.5" stroke-dasharray="6 4" />
          {lay.terrain && <path d={low} fill="url(#pat-low)" />}
          {lay.flood && <path class="flood" d={flood} fill="#a0b5eb" opacity=".7" />}
          {m.raw.map.roads.map((d, i) => <path key={i} d={d} fill="none" stroke="#cecac8" stroke-width="3" />)}
          <path d={m.raw.map.canal} fill="none" stroke="#a0b5eb" stroke-width="2" stroke-dasharray="5 3" />
          <path d={m.raw.map.river} fill="none" stroke="#a0b5eb" stroke-width="9" stroke-linecap="round" />
          {rows.value.map((r) => {
            const p = r.s.plot;
            const on = filt[r.e.tier];
            const isSel = sel === p.id;
            const focus = r.s.persona === 'focus';
            return (
              <g
                key={p.id}
                class={'plot' + (on ? '' : ' dim') + (isSel ? ' sel' : '')}
                role="button"
                tabIndex={on ? 0 : -1}
                aria-label={`${p.id}, ${p.village}: ${TIER_META[r.e.tier].label}, ${stageLabel(r.s)}${focus ? ', your farmer' : ''}`}
                onClick={() => select(r)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r); } }}
              >
                <polygon points={p.pts.join(' ')} fill={tierPaint(r.e.tier)} stroke={isSel || focus ? '#000' : '#797776'} stroke-width={isSel ? 3 : focus ? 2 : 0.8} />
                {focus && (
                  <path transform={`translate(${p.cx} ${p.cy - 3}) scale(${Math.max(1, fs(16) / 12)})`} d="M0 4c-4-5-6-7.5-6-10.5a6 6 0 0 1 12 0C6-3.5 4-1 0 4z" fill="#000" stroke="#fff" stroke-width="1" />
                )}
              </g>
            );
          })}
          {importedRows.value.map((r) => (
            <g key={r.k.head} class="imp-badge" aria-hidden="true">
              <circle cx={r.s.plot.cx} cy={r.s.plot.cy} r={fs(14)} fill="none" stroke="#000" stroke-width={fs(2)} />
              <circle cx={r.s.plot.cx} cy={r.s.plot.cy} r={fs(9)} fill="none" stroke="#000" stroke-width={fs(1.2)} stroke-dasharray={`${fs(3)} ${fs(2)}`} />
              {!small && <text x={r.s.plot.cx + fs(18)} y={r.s.plot.cy + fs(4)} style={{ fontSize: fs(12) + 'px', strokeWidth: fs(3) + 'px' }} class="vlabel">Imported (live)</text>}
            </g>
          ))}
          {t >= hz.t && (
            <g class="hail" aria-hidden="true">
              <circle cx={hz.x} cy={hz.y} r={hz.r} fill="none" stroke="#242424" stroke-width="1.5" stroke-dasharray="4 4" />
              {!small && <text class="vlabel" x={hz.x} y={hz.y + hz.r + fs(14)} text-anchor="middle" style={{ fontSize: fs(12) + 'px', strokeWidth: fs(3) + 'px' }}>Hail cell · low confidence</text>}
            </g>
          )}
          {lay.gauges && m.stations.map((s) => (
            <g key={s.id} class="gauge" aria-hidden="true">
              <path d={`M${s.x} ${s.y - 7}l6 10h-12z`} fill="#242424" />
              {!small && <text x={s.x + 9} y={s.y + 3} style={{ fontSize: fs(12) + 'px' }}>{s.id}</text>}
            </g>
          ))}
          {m.raw.map.villages.map((vl) => (
            <text key={vl.name} class="vlabel" x={vl.x} y={vl.y - 50} text-anchor="middle" aria-hidden="true" style={{ fontSize: fs(13) + 'px', strokeWidth: fs(3) + 'px' }}>{vl.name}</text>
          ))}
          <g class="scale" aria-hidden="true" transform={`translate(${vx + fs(16)} ${vy + vh - fs(16)})`}>
            <path d="M0 0h100M0 -4v8M100 -4v8" stroke="#242424" stroke-width="1.5" fill="none" />
            <text x="50" y={-fs(6)} text-anchor="middle" style={{ fontSize: fs(12) + 'px' }}>1 km</text>
          </g>
        </svg>
      </div>
      <figcaption>
        {m.raw.district} · {pass === null ? 'no radar pass processed yet' : `flood extent from the simulated radar pass at ${fmtT(pass)}`} · synthetic terrain
      </figcaption>
    </figure>
  );
}

export function Legend() {
  const filt = tierFilter.value;
  const lay = layers.value;
  const tiers: Tier[] = ['supported', 'partial', 'insufficient', 'none'];
  const counts = rows.value.reduce<Record<string, number>>((a, r) => { a[r.e.tier] = (a[r.e.tier] ?? 0) + 1; return a; }, {});
  const m = model.value!;
  return (
    <div class="legend">
      <fieldset>
        <legend>Evidence tier · filter</legend>
        {tiers.map((tr) => (
          <label key={tr} class="lg-item">
            <input type="checkbox" checked={filt[tr]} onChange={() => (tierFilter.value = { ...filt, [tr]: !filt[tr] })} />
            <svg width="28" height="20" aria-hidden="true"><rect x=".5" y=".5" width="27" height="19" rx="4" fill={tierPaint(tr)} stroke="#797776" /></svg>
            <span>{TIER_META[tr].label}</span>
            <span class="cnt num">{counts[tr] ?? 0}</span>
          </label>
        ))}
      </fieldset>
      {importedRows.value.length > 0 && (
        <p class="lg-item lg-imp"><svg width="28" height="20" aria-hidden="true"><circle cx="14" cy="10" r="8" fill="none" stroke="#000" stroke-width="2" /></svg><span>Imported (live) from a judge’s phone</span></p>
      )}
      <fieldset>
        <legend>Layers</legend>
        {(['flood', 'terrain', 'gauges'] as const).map((k) => (
          <label key={k} class="lg-item">
            <input type="checkbox" checked={lay[k]} onChange={() => (layers.value = { ...lay, [k]: !lay[k] })} />
            <span>{k === 'flood' ? 'Flood extent (simulated radar)' : k === 'terrain' ? 'Low-lying terrain' : `Rain gauges (${m.stations.map((s) => s.id).join(', ')})`}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

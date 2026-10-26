import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../ui/Icon';
import { tr } from '../../lib/i18n';
import { fmtClock } from '../../lib/time';
import { short } from '../../lib/hash';
import { announce } from '../../lib/announce';
import { lowData } from '../../lib/prefs';
import { view, addShot, addSyntheticShot, getGeo, watchGeo, seal, busy, photoUrl, photoTick, ConsentMissing } from '../focus';
import { activePlotId, focusPlot } from '../../sim/engine';
import { normalizePhoto, isFresh, SHOTS, type ShotKind } from '../photo';
import { screen } from '../nav';
import { ShotPicto } from '../parts';
import { Val } from '../../ui/ProvTag';

export function Thumb({ id, alt }: { id: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    photoUrl(id).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [id, photoTick.value]);
  if (lowData.value) return <div class="thumb thumb-ph" role="img" aria-label={alt}><Icon name="image" /></div>;
  return url ? <img class="thumb" src={url} alt={alt} width="96" height="72" decoding="async" /> : <div class="thumb thumb-ph" aria-hidden="true" />;
}

function Viewfinder({ onShot, onFail, onClose }: { onShot: (b: Blob, w: number, h: number) => void; onFail: () => void; onClose: () => void }) {
  const vid = useRef<HTMLVideoElement>(null);
  const shutter = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (!alive) return s.getTracks().forEach((x) => x.stop());
        stream = s;
        if (vid.current) vid.current.srcObject = s;
        shutter.current?.focus();
      })
      .catch(onFail);
    return () => { alive = false; stream?.getTracks().forEach((x) => x.stop()); };
  }, []);
  const snap = () => {
    const v = vid.current;
    if (!v?.videoWidth) return;
    const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => b && onShot(b, c.width, c.height), 'image/jpeg', 0.8);
  };
  return (
    <div class="finder" role="dialog" aria-modal="true" aria-label={tr('cap.open')} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <video ref={vid} autoplay playsInline muted />
      <div class="finder-bar">
        <button type="button" class="iconbtn light" onClick={onClose} aria-label={tr('set.close')}><Icon name="x" /></button>
        <button type="button" ref={shutter} class="shutter" onClick={snap} aria-label={tr('cap.shutter')} />
        <span class="finder-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}

/** A helper seals a farmer's evidence, not "my evidence" (audit H11). */
export const sealLabel = () => (activePlotId.value !== null ? tr('hm.seal', { farmer: focusPlot.value!.name }) : tr('cap.done'));

/** Seal, or say on screen why it did not happen (storage failed, or the farmer has not agreed). True once sealed. */
export async function sealOrSay(setMsg: (m: string | null) => void): Promise<boolean> {
  setMsg(null);
  try {
    await seal();
    return true;
  } catch (e) {
    setMsg(e instanceof ConsentMissing ? tr('cap.needConsent', { farmer: focusPlot.value!.name }) : tr('cap.sealFail'));
    return false;
  }
}

export function Capture() {
  const v = view.value;
  const [sel, setSel] = useState<ShotKind | null>(null);
  const [phase, setPhase] = useState<'idle' | 'locating' | 'hashing'>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const [finder, setFinder] = useState(false);
  /** The camera is blocked or missing: say so and let the person choose, never swap in a simulated photo on their behalf. */
  const [camBlocked, setCamBlocked] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // listen for the location while the screen is open, so the first photo does not wait for a cold GPS fix
  useEffect(() => watchGeo(), []);
  const kind = sel ?? SHOTS.find((k) => !v.shots[k]) ?? null;
  const helper = v.consent?.helper;
  /** A helper is capturing for a farmer who has not agreed yet: no photo until they do. */
  const needConsent = activePlotId.value !== null && !v.consent;
  const n = kind ? SHOTS.indexOf(kind) + 1 : 3;

  async function take(blob: Blob, w: number, h: number) {
    if (!kind) return;
    setMsg(null);
    setCamBlocked(false);
    try {
      setPhase('locating');
      const geo = await getGeo();
      setPhase('hashing');
      await addShot(kind, blob, w, h, geo, false, helper);
      setSel(null);
      announce(tr('cap.taken') + ': ' + tr('shot.' + kind));
    } catch (e) {
      setMsg(e instanceof ConsentMissing ? tr('cap.needConsent', { farmer: focusPlot.value!.name }) : tr('cap.saveFail'));
    } finally {
      setPhase('idle');
    }
  }

  async function simulated() {
    if (!kind) return;
    setCamBlocked(false);
    try {
      setPhase('hashing');
      await addSyntheticShot(kind, helper);
      setSel(null);
      announce(tr('cap.taken') + ': ' + tr('shot.' + kind));
    } catch {
      setMsg(tr('cap.saveFail'));
    } finally {
      setPhase('idle');
    }
  }

  function openCamera() {
    setMsg(null);
    setCamBlocked(false);
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (!coarse && typeof navigator.mediaDevices?.getUserMedia === 'function') setFinder(true);
    else fileRef.current?.click();
  }

  async function onFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (!isFresh(f)) { setMsg(tr('cap.old')); return; }
    setPhase('hashing');
    let photo: Awaited<ReturnType<typeof normalizePhoto>>;
    try {
      photo = await normalizePhoto(f);
    } catch {
      // a file the phone cannot decode is refused, not stored as it came
      setPhase('idle');
      setMsg(tr('cap.badPhoto'));
      return;
    }
    await take(photo.blob, photo.w, photo.h);
  }

  const all = SHOTS.every((k) => v.shots[k]);
  // A plain-HTTP LAN address is not a secure context: no camera, no GPS, no WebCrypto. Say so instead of failing quietly.
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;
  return (
    <div class="stack f-stack">
      <h2 class="f-title">{tr('cap.title')}</h2>
      {insecure && <p class="note note-warn" role="status"><Icon name="info" /><span>{tr('sec.http')}</span></p>}
      {helper && <p class="tag"><Icon name="users" size={16} /> {tr('cap.helper', { name: helper })}</p>}
      <ol class="steps3" aria-label={tr('cap.title')}>
        {SHOTS.map((k, i) => (
          <li key={k} class={v.shots[k] ? 'done' : k === kind ? 'cur' : ''} aria-current={k === kind ? 'step' : undefined}>
            <span class="dot num">{v.shots[k] ? <Icon name="check" size={16} /> : i + 1}</span>
            <span>{tr('shot.' + k)}</span>
          </li>
        ))}
      </ol>

      {needConsent ? (
        <div class="shotcard" data-need-consent>
          <p class="note note-warn" role="status"><Icon name="info" /><span>{tr('cap.needConsent', { farmer: focusPlot.value!.name })}</span></p>
          <button type="button" class="pill pill-primary pill-lg pill-block" onClick={() => (screen.value = 'assist')}>
            {tr('cap.askConsent')} <span class="arrow" aria-hidden="true">→</span>
          </button>
        </div>
      ) : kind && !all ? (
        <div class="shotcard" data-tour="shot">
          <p class="eyebrow">{tr('cap.step', { n })}</p>
          <ShotPicto kind={kind} />
          <h3>{tr('shot.' + kind)}</h3>
          <p>{tr('shot.' + kind + '.d')}</p>
          {phase !== 'idle' ? (
            <p class="working" role="status"><span class="spin" aria-hidden="true" /> <span>{tr(phase === 'locating' ? 'cap.locating' : 'cap.hashing')}</span></p>
          ) : (
            <>
              <button type="button" class="pill pill-primary pill-lg pill-block" onClick={openCamera} disabled={busy.value}>
                <Icon name="camera" /> {tr('cap.open')} <span class="arrow" aria-hidden="true">→</span>
              </button>
              <button type="button" class="link-arrow" onClick={() => simulated()}>{tr('cap.sim')} <span aria-hidden="true">→</span></button>
            </>
          )}
          {camBlocked && <p class="note note-warn" role="alert" data-cam-blocked><Icon name="info" /><span>{tr('cap.camDenied')}</span></p>}
          {msg && <p class="note note-bad" role="alert"><Icon name="barShape" /><span>{msg}</span></p>}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" class="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        </div>
      ) : (
        <>
          <button type="button" class="pill pill-primary pill-lg pill-block" disabled={busy.value || !!v.seal} onClick={async () => { if (await sealOrSay(setMsg)) screen.value = 'packet'; }}>
            <Icon name="lock" /> {sealLabel()} <span class="arrow" aria-hidden="true">→</span>
          </button>
          {msg && <p class="note note-bad" role="alert" data-seal-fail><Icon name="barShape" /><span>{msg}</span></p>}
        </>
      )}

      <ul class="shots" role="list" data-tour="shots">
        {SHOTS.filter((k) => v.shots[k]).map((k) => {
          const s = v.shots[k]!;
          return (
            <li key={k}>
              <Thumb id={s.photoId} alt={tr('shot.' + k)} />
              <div class="shot-meta">
                <Val kind="photo" prov={s.synthetic ? 'sim' : 'live'}><strong>{tr('shot.' + k)}</strong></Val>
                {/* the replay clock, also for a live photo: the phone's own time is in the sync log (audit F14) */}
                <Val kind="time" prov="sim"><span class="num">{fmtClock(s.simT)}</span></Val>
                <Val kind="loc" prov={s.geo.src === 'gps' ? 'live' : 'sim'}>{s.geo.src === 'gps' ? tr('cap.gps', { acc: s.geo.acc }) : tr('cap.simGps')}</Val>
                <span class="hash">{short(s.sha, 12)}</span>
                <span class={s.recvT === null ? 'tag' : 'tag tag-ok'}>
                  <Icon name={s.recvT === null ? 'clock' : 'okShape'} size={16} /> {s.recvT === null ? tr('cap.queued') : tr('cap.sent')}
                </span>
              </div>
              {!v.seal && (
                <button type="button" class="pill pill-ghost pill-sm" onClick={() => setSel(k)} aria-label={`${tr('cap.retake')}: ${tr('shot.' + k)}`}>
                  {tr('cap.retake')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {finder && (
        <Viewfinder
          onShot={(b, w, h) => { setFinder(false); take(b, w, h); }}
          onFail={() => { setFinder(false); setCamBlocked(true); }}
          onClose={() => setFinder(false)}
        />
      )}
    </div>
  );
}

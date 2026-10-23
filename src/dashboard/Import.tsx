// Feature K, laptop side (lazy chunk): import a sealed packet by webcam QR, pasted code, or #k= link.
// Recomputes the chain and checks the signature, then adds the plot to the dashboard with where it came from.
import '../styles/console.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { ProvTag, Val } from '../ui/ProvTag';
import { fmtT } from '../lib/time';
import { announce } from '../lib/announce';
import { fromOrigin } from '../lib/prov';
import { model, t, seek, pause } from '../sim/engine';
import { verifyCode, codeBytes, codeFromQrText, b64url, type KResult, type KPayload } from '../k/payload';
import { scanQr } from '../k/scan';
import { makeBundle, bundleJson } from '../k/bundle';
import { download } from '../lib/download';
import { addImported, importedLabel } from '../k/imported';
import { GAP_FLAG_H } from '../farmer/focus';
import { openPlot } from '../site/layout';
import { ConsoleNote } from './ConsoleNote';

const NO_CRYPTO = 'This page cannot check signatures here. Open it over https, or on localhost.';

function Checks({ res }: { res: KResult }) {
  const steps: [string, boolean | null][] = [
    ['Code decoded', res.failed !== 'decode'],
    ['Packet chain recomputed and matches its head', res.failed === 'decode' ? null : res.failed !== 'chain'],
    ['ECDSA P-256 signature valid for the key in the code', res.failed === 'decode' || res.failed === 'chain' ? null : res.failed !== 'signature'],
  ];
  return (
    <ol class="k-steps" role="list">
      {steps.map(([l, s]) => (
        <li key={l} class={s === null ? 'skip' : s ? 'ok' : 'bad'}>
          <Icon name={s === null ? 'target' : s ? 'okShape' : 'barShape'} size={16} />
          <span>{l}{s === null ? ' (not reached)' : ''}</span>
        </li>
      ))}
    </ol>
  );
}

/** When the laptop received the packet, against the phone's own clock at sealing. Large or negative gaps are flagged. */
function Receipt({ p, receivedAt }: { p: KPayload; receivedAt: number }) {
  const gapH = (receivedAt - p.deviceMs) / 3.6e6;
  const note = gapH < -0.1
    ? `The phone's clock is ${Math.round(-gapH * 60)} min ahead of this laptop's. Treat the phone's time with care.`
    : gapH > GAP_FLAG_H
      ? `Received ${gapH.toFixed(1)} h after sealing: flagged for review.`
      : null;
  return (
    <>
      <div><dt>Received by this console</dt><dd class="num"><Val kind="time" prov="live" english>{new Date(receivedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}</Val></dd></div>
      {note && <div><dt>Clock check</dt><dd>{note}</dd></div>}
    </>
  );
}

function Details({ res, receivedAt }: { res: KResult; receivedAt: number }) {
  const p = res.payload!;
  const plot = model.value?.plots.find((x) => x.id === p.plot);
  return (
    <div class="k-details">
      <dl class="facts">
        <div><dt>Plot</dt><dd>{p.plot}{plot ? ` · ${plot.name} · ${plot.village}` : ''} <ProvTag prov="sim" english /></dd></div>
        <div><dt>Event began</dt><dd class="num">{fmtT(p.eventT)}</dd></div>
        <div><dt>Sealed (replay time)</dt><dd class="num">{fmtT(p.sealT)}</dd></div>
        <div><dt>Phone clock at sealing</dt><dd class="num"><Val kind="time" prov="live" english>{new Date(p.deviceMs).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Val></dd></div>
        <Receipt p={p} receivedAt={receivedAt} />
        <div><dt>Coarse location (~100 m)</dt><dd class="num"><Val kind="loc" prov={fromOrigin(p.shots[0].loc)} english>{p.lat.toFixed(3)}, {p.lon.toFixed(3)}</Val></dd></div>
        <div><dt>Chain head</dt><dd class="hash">{p.head.slice(0, 24)}…</dd></div>
      </dl>
      <ul class="k-shots" role="list">
        {p.shots.map((s) => (
          <li key={s.kind} data-k-shot>
            <div class="k-ph" role="img" aria-label={`${s.kind} photo: stays on the farmer’s phone`}><Icon name="lock" /><span aria-hidden="true">Stays on the phone</span></div>
            <span class="cap">{s.kind}</span>
            <span class="num">{fmtT(s.simT)}</span>
            <span class="hash">{s.sha.slice(0, 12)}…</span>
            <span class="k-origins">
              <Val kind="photo" prov={fromOrigin(s.photo)} english>photo</Val>
              <Val kind="loc" prov={fromOrigin(s.loc)} english>location</Val>
            </span>
          </li>
        ))}
      </ul>
      <p class="muted">Photos stay on the farmer’s phone; only their SHA-256 fingerprints travel. The labels say where each photo and location came from: they are what the phone’s software wrote, sealed so they cannot be changed afterwards. The real product would upload the photos with consent.</p>
    </div>
  );
}

export default function ImportSheet({ initial, onClose }: { initial?: string; onClose: () => void }) {
  const [mode, setMode] = useState<'scan' | 'paste'>(initial ? 'paste' : 'scan');
  const [text, setText] = useState(initial ?? '');
  const [res, setRes] = useState<KResult | null>(null);
  /** The exact code that produced `res`: what is exported and added, never what is in the box now. */
  const [checked, setChecked] = useState('');
  const [receivedAt, setReceivedAt] = useState(0);
  /** Set while a changed copy is on screen: the code to put back. */
  const [original, setOriginal] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const run = async (input: string) => {
    const code = codeFromQrText(input);
    let r: KResult;
    try {
      r = await verifyCode(code);
    } catch {
      r = { ok: false, failed: 'decode', reason: NO_CRYPTO };
    }
    setRes(r);
    setChecked(code);
    setReceivedAt(Date.now());
    setAdded(false);
    announce(r.ok ? 'Integrity verified: not altered since sealing.' : `Verification failed: ${r.reason}`);
  };
  useEffect(() => { if (initial) void run(initial); }, []);
  useEffect(() => {
    if (mode !== 'scan' || !video.current) return;
    setCamErr(null);
    return scanQr(video.current, (c) => { setText(codeFromQrText(c)); setMode('paste'); void run(c); }, () => setCamErr('No camera available here. Paste the code or open the link instead.'));
  }, [mode]);

  async function add() {
    if (!res?.ok || !res.payload) return;
    await addImported(res.payload, checked, receivedAt);
    // the replay clock goes to the packet's time, so the ledger and the officer view show it straight away
    pause();
    seek(Math.max(t.value, res.payload.sealT + 0.05));
    setAdded(true);
    announce(`${res.payload.plot} added to the dashboard as ${importedLabel(res.payload)}.`);
  }

  /** What a tampered copy looks like: one bit of the first photo's fingerprint changed, nothing else. */
  function change() {
    const bytes = codeBytes(checked);
    if (!bytes) return;
    bytes[19 + 3] ^= 0x01;
    const changed = b64url(bytes);
    setOriginal(checked);
    setText(changed);
    void run(changed);
  }
  function restore() {
    if (!original) return;
    setText(original);
    void run(original);
    setOriginal(null);
  }

  return (
    <Sheet title="Import evidence" onClose={onClose} closeLabel="Close import" class="import-sheet" lang="en">
      <ConsoleNote />
      <p class="muted">Real signatures and hashes over a synthetic plot.</p>
      <p class="muted">Bring a sealed packet from the farmer’s phone, with no server: scan its QR code, paste its code, or open its link (the code travels in the link’s #fragment, which is never sent to any server).</p>
      <div class="seg" role="radiogroup" aria-label="Import method">
        <button type="button" role="radio" aria-checked={mode === 'scan'} onClick={() => setMode('scan')}><Icon name="scan" size={16} /> Scan QR</button>
        <button type="button" role="radio" aria-checked={mode === 'paste'} onClick={() => setMode('paste')}><Icon name="paste" size={16} /> Paste code</button>
      </div>
      {mode === 'scan' ? (
        <div class="k-scan">
          <video ref={video} muted playsInline aria-label="Webcam preview for QR scanning" />
          {camErr ? <p class="note note-warn"><Icon name="info" /><span>{camErr}</span></p> : <p class="muted">Hold the farmer’s phone up to the webcam.</p>}
        </div>
      ) : (
        <form class="stack" onSubmit={(e) => { e.preventDefault(); setOriginal(null); void run(text); }}>
          <label class="field">
            <span>Evidence code or link</span>
            <textarea class="input k-text" rows={4} value={text} onInput={(e) => { setText((e.currentTarget as HTMLTextAreaElement).value); setRes(null); setOriginal(null); setAdded(false); }} spellcheck={false} />
          </label>
          <button type="submit" class="pill pill-dark" disabled={!text.trim()}><Icon name="shield" /> Verify</button>
        </form>
      )}
      {res && (
        <section class="k-result" aria-live="polite">
          <Checks res={res} />
          {res.ok ? (
            <p class="note note-ok"><Icon name="okShape" /><span><strong>Integrity verified: not altered since sealing.</strong> This does not prove who sealed it.</span></p>
          ) : (
            <p class="note note-bad"><Icon name="barShape" /><span>{res.failed === 'decode' ? '' : <strong>Changed after sealing. Do not trust this copy. </strong>}{res.reason}</span></p>
          )}
          {original && !res.ok && (
            <p class="muted">This is the packet you checked, with one bit of the first photo fingerprint changed, as a tampered copy would be. <button type="button" class="link-arrow" data-restore onClick={restore}>Put the original back</button></p>
          )}
          {res.payload && <Details res={res} receivedAt={receivedAt} />}
          {res.ok && res.payload && (
            <button type="button" class="pill pill-ghost" data-export-bundle onClick={() => download(`saboot-evidence-${res.payload!.plot}.json`, bundleJson(makeBundle(checked, res.payload!)), 'application/json')}>
              <Icon name="download" size={16} /> Export evidence bundle (JSON)
            </button>
          )}
          {res.ok && !original && (
            <button type="button" class="pill pill-ghost" data-change-copy onClick={change}><Icon name="barShape" size={16} /> Try a changed copy</button>
          )}
          {res.ok && (added ? (
            <p class="note note-plain"><Icon name="check" /><span>Added to the dashboard as <strong>{importedLabel(res.payload!)}</strong>. <button type="button" class="link-arrow" onClick={() => { onClose(); openPlot.value = res.payload!.plot; }}>Open {res.payload!.plot}</button></span></p>
          ) : (
            <button type="button" class="pill pill-dark" onClick={add}><Icon name="inbox" /> Add to dashboard</button>
          ))}
        </section>
      )}
    </Sheet>
  );
}


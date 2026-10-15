// Feature K, laptop side (lazy chunk): import a sealed packet by webcam QR, pasted code, or #k= link.
// Recomputes the chain and checks the signature, then adds the plot to the dashboard as "Imported (live)".
import '../styles/console.css';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { fmtT } from '../lib/time';
import { announce } from '../lib/announce';
import { model } from '../sim/engine';
import { verifyCode, type KResult } from '../k/payload';
import { scanQr } from '../k/scan';
import { makeBundle, bundleJson } from '../k/bundle';
import { download } from '../lib/download';
import { addImported } from '../k/imported';
import { openPlot } from '../site/layout';
import { ConsoleNote } from './ConsoleNote';

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

function Details({ res }: { res: KResult }) {
  const p = res.payload!;
  const plot = model.value?.plots.find((x) => x.id === p.plot);
  return (
    <div class="k-details">
      <dl class="facts">
        <div><dt>Plot</dt><dd>{p.plot}{plot ? ` · ${plot.name} · ${plot.village}` : ''}</dd></div>
        <div><dt>Event began</dt><dd class="num">{fmtT(p.eventT)}</dd></div>
        <div><dt>Sealed (replay time)</dt><dd class="num">{fmtT(p.sealT)}</dd></div>
        <div><dt>Phone clock at sealing</dt><dd class="num">{new Date(p.deviceMs).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
        <div><dt>Coarse location (~100 m)</dt><dd class="num">{p.lat.toFixed(3)}, {p.lon.toFixed(3)}</dd></div>
        <div><dt>Chain head</dt><dd class="hash">{p.head.slice(0, 24)}…</dd></div>
      </dl>
      <ul class="k-shots" role="list">
        {p.shots.map((s) => (
          <li key={s.kind}>
            <div class="k-ph" role="img" aria-label={`${s.kind} photo: stays on the farmer’s phone`}><Icon name="lock" /><span aria-hidden="true">Stays on the phone</span></div>
            <span class="cap">{s.kind}</span>
            <span class="num">{fmtT(s.simT)}</span>
            <span class="hash">{s.sha.slice(0, 12)}…</span>
          </li>
        ))}
      </ul>
      <p class="muted">Photos stay on the farmer’s phone; only their SHA-256 fingerprints travel. The real product would upload the photos to the insurer with consent.</p>
    </div>
  );
}

export default function ImportSheet({ initial, onClose }: { initial?: string; onClose: () => void }) {
  const [mode, setMode] = useState<'scan' | 'paste'>(initial ? 'paste' : 'scan');
  const [text, setText] = useState(initial ?? '');
  const [res, setRes] = useState<KResult | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  const run = async (code: string) => {
    const r = await verifyCode(code);
    setRes(r);
    setAdded(false);
    announce(r.ok ? 'Integrity verified: not altered since sealing.' : `Verification failed: ${r.reason}`);
  };
  useEffect(() => { if (initial) void run(initial); }, []);
  useEffect(() => {
    if (mode !== 'scan' || !video.current) return;
    setCamErr(null);
    return scanQr(video.current, (t) => { setText(t); setMode('paste'); void run(t); }, () => setCamErr('No camera available here. Paste the code or open the link instead.'));
  }, [mode]);

  async function add() {
    if (!res?.ok || !res.payload) return;
    await addImported(res.payload, text);
    setAdded(true);
    announce(`${res.payload.plot} added to the dashboard as Imported (live).`);
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
        <form class="stack" onSubmit={(e) => { e.preventDefault(); void run(text); }}>
          <label class="field">
            <span>Evidence code or link</span>
            <textarea class="input k-text" rows={4} value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} spellcheck={false} />
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
            <p class="note note-bad"><Icon name="barShape" /><span>{res.reason}</span></p>
          )}
          {res.payload && <Details res={res} />}
          {res.ok && res.payload && (
            <button type="button" class="pill pill-ghost" data-export-bundle onClick={() => download(`saboot-evidence-${res.payload!.plot}.json`, bundleJson(makeBundle(text, res.payload!)), 'application/json')}>
              <Icon name="download" size={16} /> Export evidence bundle (JSON)
            </button>
          )}
          {res.ok && (added ? (
            <p class="note note-plain"><Icon name="check" /><span>Added to the dashboard as <strong>Imported (live)</strong>. <button type="button" class="link-arrow" onClick={() => { onClose(); openPlot.value = res.payload!.plot; }}>Open {res.payload!.plot}</button></span></p>
          ) : (
            <button type="button" class="pill pill-dark" onClick={add}><Icon name="inbox" /> Add to dashboard</button>
          ))}
        </section>
      )}
    </Sheet>
  );
}

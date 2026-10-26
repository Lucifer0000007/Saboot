// Feature K, phone side (lazy chunk): turn the sealed packet into a signed code shown as a QR code, a
// copyable code and a #k= link. Nothing is uploaded by itself; photos stay on the phone. A phone that opened the app from
// the demo laptop's address can send the code to that laptop, and only when the person taps.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { tr } from '../lib/i18n';
import { showToast } from '../lib/announce';
import { dbGet, dbSet } from '../lib/db';
import { focusDet, focusPlot, model } from '../sim/engine';
import { download } from '../lib/download';
import { full, isOffline } from './focus';
import { receiver } from '../lib/prefs';
import { queueSend, sendOf, sends, sending, failed, loadSends } from '../k/receipt';
import { SHOTS } from './photo';
import { makeCode, newDeviceKey, qrTextOf, verifyCode } from '../k/payload';
import { makeBundle, bundleJson } from '../k/bundle';
import { qrPath } from '../k/qr';

async function deviceKey(): Promise<CryptoKeyPair> {
  const k = await dbGet<CryptoKeyPair>('kv', 'k-device-key');
  if (k) return k;
  const fresh = await newDeviceKey();
  await dbSet('kv', 'k-device-key', fresh);
  return fresh;
}

/** The signed code for what was sealed: only the sealed photos, each with where it and its location came from. */
export async function buildCode(): Promise<string> {
  const v = full.value, d = focusDet.value!, p = focusPlot.value!;
  if (!v.seal) throw new Error('Seal the photos first.');
  const sealed = new Set(v.seal.shots);
  const kinds = SHOTS.filter((k) => v.shots[k] && sealed.has(v.shots[k]!.sha));
  if (!kinds.length) throw new Error('None of the photos in the log was sealed.');
  const first = v.shots[kinds[0]]!;
  return makeCode({
    plot: p.id, eventT: d.eventT!, sealT: v.seal.simT, deviceMs: v.seal.deviceMs ?? Date.now(), lat: first.geo.lat, lon: first.geo.lon,
    shots: kinds.map((k) => {
      const s = v.shots[k]!;
      return { kind: k, simT: s.simT, sha: s.sha, photo: s.synthetic ? 'sim' : 'live', loc: s.geo.src === 'gps' ? 'live' : 'sim' };
    }),
  }, await deviceKey());
}

export default function ShareSheet({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  // Signing needs WebCrypto, which a plain-HTTP page does not have: say so instead of spinning forever.
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;
  useEffect(() => { if (insecure) setErr(true); else buildCode().then(setCode, () => setErr(true)); }, []);
  const link = code ? `${location.origin}${location.pathname}#k=${code}` : '';
  const qr = useMemo(() => (code ? qrPath(qrTextOf(code), { ecc: 'L', border: 4 }) : null), [code]);
  const canShare = typeof navigator.share === 'function';
  // the signed code plus its decoded fields; from a helper's phone also who captured, which is NOT covered by the signature
  const exportBundle = async () => {
    if (!code) return;
    const r = await verifyCode(code);
    if (!r.ok || !r.payload) return;
    const v = full.value;
    const bundle = makeBundle(code, r.payload, {
      rail: model.value?.opts.rail,
      capturedBy: v.consent ? { who: 'helper', helper: v.consent.helper, role: v.consent.role, consent: { method: v.consent.method, replayHour: v.consent.simT } } : { who: 'farmer' },
      packetHash: v.seal?.packetHash,
    });
    download(`saboot-evidence-${r.payload.plot}.json`, bundleJson(bundle), 'application/json');
  };
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); showToast(tr('k.copied')); } catch { showToast(tr('fl.copyFail'), 'warn'); }
  };
  // the optional send to the demo laptop: the button exists only on a phone that opened the app from the laptop's address
  useEffect(() => { if (receiver.value) void loadSends(); }, []);
  void sends.value;
  const sent = code ? sendOf(code) : null;
  const sendState = !sent ? tr('k.sendHelp')
    : sent.receivedAt !== null ? tr('k.sent', { time: new Date(sent.receivedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) })
    : isOffline() ? tr('k.sendWait')
    : failed.value && !sending.value ? tr('k.sendFail')
    : tr('k.sending');
  return (
    <Sheet title={tr('k.sheet')} onClose={onClose} closeLabel={tr('set.close')} class="share-sheet">
      <p>{tr('k.lead')}</p>
      {qr ? (
        <svg class="qr" width="320" height="320" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label={tr('k.qr')} shape-rendering="crispEdges">
          <rect width={qr.size} height={qr.size} fill="#ffffff" />
          <path d={qr.d} fill="#000000" />
        </svg>
      ) : (
        <p class={insecure ? 'note note-warn' : 'working'} role="status">{insecure ? <><Icon name="info" /><span>{tr('sec.http')}</span></> : err ? tr('k.fail') : <><span class="spin" aria-hidden="true" /> <span>{tr('k.making')}</span></>}</p>
      )}
      <p class="note note-plain"><Icon name="lock" /><span>{tr('k.stay')}</span></p>
      {code && (
        <>
          <div class="row">
            <button type="button" class="pill pill-ghost" onClick={() => copy(code)}><Icon name="copy" /> {tr('k.copyCode')}</button>
            <button type="button" class="pill pill-ghost" onClick={() => (canShare ? navigator.share({ url: link }).catch(() => {}) : copy(link))}>
              <Icon name="link" /> {canShare ? tr('k.share') : tr('k.copyLink')}
            </button>
          </div>
          {receiver.value && (
            <>
              <button type="button" class="pill pill-dark" data-send-laptop onClick={() => queueSend(code, focusPlot.value!.id)}><Icon name="inbox" /> {tr('k.send')}</button>
              <p class="f-help" data-send-state role="status">{sendState}</p>
            </>
          )}
          {/* the data file and the raw code are for the officer's systems, not for the farmer (audit F12) */}
          <details class="k-code">
            <summary><span>{tr('k.code')}</span><Icon name="down" /></summary>
            <p class="hash">{code}</p>
            <button type="button" class="pill pill-ghost" data-export-bundle onClick={exportBundle}><Icon name="download" /> {tr('k.bundle')}</button>
            <p class="f-help">{tr('k.bundleNote')}</p>
          </details>
        </>
      )}
    </Sheet>
  );
}

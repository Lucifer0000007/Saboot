// Feature K, phone side (lazy chunk): turn the sealed packet into a signed code shown as a QR code, a
// copyable code and a #k= link. Nothing is uploaded; photos stay on the phone.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { tr } from '../lib/i18n';
import { showToast } from '../lib/announce';
import { dbGet, dbSet } from '../lib/db';
import { focusDet, focusPlot, model } from '../sim/engine';
import { download } from '../lib/download';
import { full } from './focus';
import { SHOTS } from './photo';
import { makeCode, newDeviceKey, verifyCode } from '../k/payload';
import { makeBundle, bundleJson } from '../k/bundle';
import { qrPath } from '../k/qr';

async function deviceKey(): Promise<CryptoKeyPair> {
  const k = await dbGet<CryptoKeyPair>('kv', 'k-device-key');
  if (k) return k;
  const fresh = await newDeviceKey();
  await dbSet('kv', 'k-device-key', fresh);
  return fresh;
}

export async function buildCode(): Promise<string> {
  const v = full.value, d = focusDet.value!, p = focusPlot.value!;
  const kinds = SHOTS.filter((k) => v.shots[k]);
  const first = v.shots[kinds[0]]!;
  return makeCode({
    plot: p.id, eventT: d.eventT!, sealT: v.seal!.simT, deviceMs: Date.now(), lat: first.geo.lat, lon: first.geo.lon,
    shots: kinds.map((k) => ({ kind: k, simT: v.shots[k]!.simT, sha: v.shots[k]!.sha })),
  }, await deviceKey());
}

export default function ShareSheet({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  // Signing needs WebCrypto, which a plain-HTTP page does not have: say so instead of spinning forever.
  const insecure = typeof window !== 'undefined' && !window.isSecureContext;
  useEffect(() => { if (insecure) setErr(true); else buildCode().then(setCode, () => setErr(true)); }, []);
  const link = code ? `${location.origin}${location.pathname}#k=${code}` : '';
  const qr = useMemo(() => (link ? qrPath(link) : null), [link]);
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
  return (
    <Sheet title={tr('k.sheet')} onClose={onClose} closeLabel={tr('set.close')} class="share-sheet">
      <p>{tr('k.lead')}</p>
      {qr ? (
        <svg class="qr" width="320" height="320" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label={tr('k.qr')} shape-rendering="crispEdges">
          <rect width={qr.size} height={qr.size} fill="#ffffff" />
          <path d={qr.d} fill="#000000" />
        </svg>
      ) : (
        <p class={insecure ? 'note note-warn' : 'working'} role="status">{insecure ? <><Icon name="info" /><span>{tr('sec.http')}</span></> : err ? tr('fl.copyFail') : <><span class="spin" aria-hidden="true" /> <span>{tr('k.making')}</span></>}</p>
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
          <button type="button" class="pill pill-ghost" data-export-bundle onClick={exportBundle}><Icon name="download" /> {tr('k.bundle')}</button>
          <p class="f-help">{tr('k.bundleNote')}</p>
          <details class="k-code">
            <summary>{tr('k.code')}</summary>
            <p class="hash">{code}</p>
          </details>
        </>
      )}
    </Sheet>
  );
}

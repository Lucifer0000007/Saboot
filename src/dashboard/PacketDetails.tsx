// What a verified packet says about itself: the plot, the times, where each photo and location came from, the chain head
// and the photo fingerprints. Shown on the import sheet and again in the imported packet's own drawer (audit OF-01).
import { ProvTag, Val } from '../ui/ProvTag';
import { Icon } from '../ui/Icon';
import { fmtT } from '../lib/time';
import { fromOrigin } from '../lib/prov';
import { model } from '../sim/engine';
import type { KResult, KPayload } from '../k/payload';
import { imported, photoReuse } from '../k/imported';
import { GAP_FLAG_H } from '../farmer/focus';

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

export function Details({ res, receivedAt }: { res: KResult; receivedAt: number }) {
  const p = res.payload!;
  const plot = model.value?.plots.find((x) => x.id === p.plot);
  const reused = photoReuse(p, imported.value);
  return (
    <div class="k-details">
      {reused.length > 0 && (
        <p class="note note-warn" data-photo-reuse><Icon name="flag" /><span><strong>Same photo file as another plot.</strong> The {reused.map((r) => `${r.kind} photo matches one in the packet for ${r.plot}`).join('; ')}. A flag to ask the farmer about, not a finding: Saboot decides nothing.</span></p>
      )}
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

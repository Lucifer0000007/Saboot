// The tamper check (F19 folded into F20, audit S-05): one console view where a seal breaks. First a real sealed packet
// from a farmer's phone, changed by one bit on the import sheet; then the console's audit ledger, a hash chain over every
// event, with one record quietly edited. It used to be a separate Ledger tab beside the console.
import { Icon } from '../ui/Icon';
import { importCode } from '../site/layout';
import { imported, importedLabel } from '../k/imported';
import { Ledger } from './Ledger';

export function TamperCheck() {
  const list = imported.value;
  return (
    <section class="tcheck" aria-labelledby="tc-h">
      <div class="stack">
        <p class="eyebrow">Tamper check</p>
        <h3 id="tc-h" class="h-sm">Change one bit and the seal breaks</h3>
        <p class="muted">Two places a quiet edit could hide: the sealed packet a farmer’s phone hands over, and the console’s own record of events. Both are checked here, in this browser, with SHA-256; the packet’s signature too.</p>
      </div>
      <div class="card stack" data-tc-packet>
        <h4>1. A sealed packet from a phone</h4>
        {list.length === 0 ? (
          <>
            <p>Seal the evidence on the farmer’s phone, then bring its code here with Import evidence: scan, paste or open the link. Once it verifies, press “Try a changed copy”. One bit of one photo fingerprint changes and the checks fail.</p>
            <button type="button" class="pill pill-dark tc-btn" onClick={() => (importCode.value = '')}><Icon name="scan" /> Import evidence</button>
          </>
        ) : (
          <>
            <p>Check an imported packet again, then press “Try a changed copy” on the import sheet: one bit of one photo fingerprint changes and the checks fail.</p>
            <ul class="tc-list" role="list">
              {list.map((k) => (
                <li key={k.head}>
                  <span><strong class="num">{k.plot}</strong> · {importedLabel(k)}</span>
                  <button type="button" class="pill pill-ghost pill-sm" data-tc-check onClick={() => (importCode.value = k.code)}><Icon name="shield" size={16} /> Check {k.plot} again</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Ledger />
    </section>
  );
}

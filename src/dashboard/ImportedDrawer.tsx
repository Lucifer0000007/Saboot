// An imported packet's own record (audit OF-01): what a phone sealed and this console verified, leading with the seal. The
// simulated cohort's record for the same plot sits below, under its own heading; it used to be the only thing that opened.
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { Seal } from '../ui/Seal';
import { openImported, openPlot } from '../site/layout';
import { importedLabel } from '../k/imported';
import type { KResult } from '../k/payload';
import { stageLabel } from '../sim/cohort';
import { importedRows, rows } from './state';
import { RowTier } from './PlotList';
import { ConsoleNote } from './ConsoleNote';
import { Details } from './PacketDetails';

export function ImportedDrawer() {
  const head = openImported.value;
  const r = head ? importedRows.value.find((x) => x.k.head === head) : undefined;
  const [check, setCheck] = useState<KResult | null>(null);
  useEffect(() => {
    setCheck(null);
    if (!r) return;
    let alive = true;
    // checked again on opening, so the record says what this console verifies now, not only what it verified on import
    import('../k/payload').then((m) => m.verifyCode(r.k.code)).then(
      (x) => alive && setCheck(x),
      () => alive && setCheck({ ok: false, failed: 'decode', reason: 'This page cannot check signatures here. Open it over https, or on localhost.' }),
    );
    return () => { alive = false; };
  }, [head, !!r]);
  if (!r) return null;
  const k = r.k, p = r.s.plot;
  const cohort = rows.value.find((x) => x.s.plot.id === p.id);
  return (
    <Sheet title={<>{p.id} · imported packet</>} onClose={() => (openImported.value = null)} closeLabel="Close imported packet" class="drawer imp-drawer" lang="en">
      <ConsoleNote />
      <div class="dr-meta">
        <p class="eyebrow">{p.village} · {p.name} · signed on the judge’s phone</p>
        <span class="tag imported-tag"><Icon name="scan" size={16} />{importedLabel(k)}</span>
      </div>
      <div class="k-verdict" data-imp-verdict>
        <Seal state={check === null ? 'sealed' : check.ok ? 'verified' : 'broken'} size={72} />
        <p>
          {check === null ? 'Checking the chain and the signature again…'
            : check.ok ? <><strong>Integrity verified: not altered since sealing.</strong> Checked again just now, in this browser. This does not prove who sealed it.</>
            : <><strong>This copy no longer verifies.</strong> {check.reason}</>}
        </p>
      </div>
      <Details res={{ ok: true, failed: null, payload: k }} receivedAt={k.importedAt} />
      <section aria-labelledby="imp-cohort">
        <h3 id="imp-cohort">Simulated cohort record</h3>
        <p class="muted">The same plot in the simulated cohort, with its scripted story. It is separate from the packet above, which a phone sealed.</p>
        {cohort && <p class="imp-cohort">{stageLabel(cohort.s)} <RowTier r={cohort} /></p>}
        <button type="button" class="link-arrow" data-open-cohort onClick={() => { openImported.value = null; openPlot.value = p.id; }}>Open the simulated record for {p.id} <Icon name="arrow" size={16} /></button>
      </section>
    </Sheet>
  );
}

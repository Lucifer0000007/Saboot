import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { fmtT } from '../lib/time';
import { short } from '../lib/hash';
import { announce } from '../lib/announce';
import { tSlow, model } from '../sim/engine';
import { layout } from '../site/layout';
import { liveViews, type FocusView } from '../farmer/focus';
import { ledger, statuses, tamper, building, verifyMs, rebuild, verifyLedger, tamperTest, restore, type LedgerLink } from '../sim/ledger';
import { rows } from './state';
import { imported, loadImported } from '../k/imported';
import { Seal } from '../ui/Seal';

function fmtData(l: LedgerLink) {
  return Object.entries(l.body.data)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === 'string' && v.length > 20 ? v.slice(0, 10) + '…' : v}`)
    .join(' · ');
}

/** The plot the ledger is narrowed to ('' = every plot). The plot drawer's "Ledger for this plot" sets it (audit OF-14). */
export const ledgerPlot = signal('');
const ledgerType = signal('');
/** Records shown at first, the latest ones, and how many more each tap brings: 10 on a phone (each is a tall card there),
 *  20 on wider screens (audit UI-12: no scroll box inside the page). */
const pageSize = () => (layout.value === 'mobile' ? 10 : 20);

function download(name: string, text: string, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Ledger() {
  const t = tSlow.value;
  const list = rows.value;
  useEffect(() => {
    const id = setTimeout(() => {
      // the real fingerprints of every log: the demo farmer's and each farmer a helper captured for
      const { focus, live } = liveViews(t);
      const shotsOf = (f: FocusView) => {
        const o: Record<string, string> = {};
        for (const k of ['wide', 'close', 'landmark'] as const) if (f.shots[k]) o[k] = f.shots[k]!.sha;
        return o;
      };
      const shots: Record<string, Record<string, string>> = { [model.value?.raw.focus ?? '']: shotsOf(focus) };
      for (const [id, f] of Object.entries(live)) shots[id] = shotsOf(f);
      rebuild(list, t, shots, imported.value);
    }, 250);
    return () => clearTimeout(id);
  }, [t, list, imported.value]);
  useEffect(() => { void loadImported(); }, []);

  const c = ledger.value;
  const st = statuses.value;
  const tp = tamper.value;
  const bad = st ? st.indexOf('tampered') : -1;
  const [more, setMore] = useState(0);
  // the filters narrow what is shown; the chain is always verified whole, from genesis
  const fp = ledgerPlot.value, ft = ledgerType.value;
  const match = c.flatMap((l, i) => ((!fp || l.body.plot === fp) && (!ft || l.body.type === ft) ? [i] : []));
  const PAGE = pageSize();
  const shown = match.slice(Math.max(0, match.length - PAGE - more));
  const plots = [...new Set(c.map((l) => l.body.plot))].sort();
  const types = [...new Set(c.map((l) => l.body.type))].sort();

  async function onVerify() {
    await verifyLedger();
    const s = statuses.value!;
    const i = s.indexOf('tampered');
    announce(i < 0 ? `Chain intact: ${s.length} records verified.` : `Integrity failure at record ${i + 1}. ${s.length - i - 1} later records cannot be trusted.`);
  }
  async function onTamper() {
    await tamperTest();
    const i = statuses.value?.indexOf('tampered') ?? -1;
    announce(`Tamper test: record ${i + 1} edited without re-hashing. Verification fails at that record.`);
    // show that plot's own trail, where the changed record sits, and bring the verdict to the top of the screen
    // (audit OF-02: the record used to be centred and the explanation scrolled away above it)
    if (i >= 0) {
      const plot = ledger.value[i].body.plot;
      ledgerPlot.value = plot;
      ledgerType.value = '';
      // that plot's latest records, reaching back far enough to include the changed one
      const own = ledger.value.flatMap((l, k) => (l.body.plot === plot ? [k] : []));
      setMore(Math.max(0, own.length - own.indexOf(i) - pageSize()));
    }
    requestAnimationFrame(() => document.querySelector('.lg-status')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }

  return (
    <section class="ledger" aria-labelledby="lg-h" data-tour="ledger">
      <div class="row-between">
        <div class="stack">
          <p class="eyebrow">Audit ledger</p>
          <h4 id="lg-h" class="h-sm">2. Every event, hash-chained <span class="cnt num">{c.length}</span></h4>
          <p class="muted">Append-only. Each record stores SHA-256(previous hash + record), computed in your browser with WebCrypto at <span class="num">{fmtT(t)}</span>. The records describe a simulated cohort; the hashing is real.</p>
        </div>
        <div class="lg-actions">
          <button type="button" class="pill pill-dark pill-sm" onClick={onVerify} disabled={building.value || !c.length}><Icon name="shield" /> Verify integrity</button>
          {tp ? (
            <button type="button" class="pill pill-ghost pill-sm" data-lg-restore onClick={restore}><Icon name="reset" /> Restore record</button>
          ) : (
            <button type="button" class="pill pill-ghost pill-sm tamper-btn" onClick={onTamper} disabled={building.value || !c.length}><Icon name="alert" /> Tamper test</button>
          )}
          <button type="button" class="pill pill-ghost pill-sm" onClick={() => download('saboot-ledger-simulated.json', JSON.stringify(c, null, 1))}><Icon name="download" size={18} /> Export</button>
        </div>
      </div>
      <div aria-live="polite" class="lg-status">
        {st && (
          <div class="lg-verdict">
            <Seal state={bad < 0 ? 'verified' : 'broken'} size={64} />
            {bad < 0 ? (
              <p class="note note-ok"><Icon name="okShape" /><span>Chain intact — {st.length} records recomputed from genesis in {verifyMs.value} ms. No record was changed.</span></p>
            ) : (
              <p class="note note-bad"><Icon name="barShape" /><span>Integrity failure at record #{bad + 1} ({c[bad].body.type}, <span class="nowrap">{c[bad].body.plot}</span>): its stored hash no longer matches its contents. {st.length - bad - 1} later records chain from a broken link and cannot be trusted. <button type="button" class="link-arrow" data-show-changed onClick={() => document.getElementById('lg-' + bad)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>Show the changed record</button></span></p>
            )}
          </div>
        )}
        {tp && <p class="note note-warn"><Icon name="info" /><span>Tamper test active: record #{tp.seq + 1} was edited (time moved 6 h earlier, “backdating” a photo) without re-hashing. The ledger is frozen until you restore it.</span></p>}
        {!c.length && <p class="note note-plain"><Icon name="info" /><span>No events yet at {fmtT(t)}. Jump to “Trigger”.</span></p>}
      </div>
      {c.length > 0 && (
        <div class="row lg-filters">
          <label class="sortby">
            <span>Plot</span>
            <select class="input" value={fp} data-lg-plot onChange={(e) => { ledgerPlot.value = (e.currentTarget as HTMLSelectElement).value; setMore(0); }}>
              <option value="">Every plot</option>
              {plots.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label class="sortby">
            <span>Record</span>
            <select class="input" value={ft} data-lg-type onChange={(e) => { ledgerType.value = (e.currentTarget as HTMLSelectElement).value; setMore(0); }}>
              <option value="">Every kind</option>
              {types.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
      )}
      {c.length > 0 && (
        <p class="muted lg-count" data-lg-count>
          Showing <span class="num">{shown.length}</span> of <span class="num">{match.length}</span> {fp || ft ? 'matching ' : ''}records{match.length < c.length ? <> (the chain holds <span class="num">{c.length}</span>; verification always covers all of them)</> : ''}.{' '}
          {shown.length < match.length && <button type="button" class="link-arrow" data-lg-older onClick={() => setMore(more + PAGE)}>Show {Math.min(PAGE, match.length - shown.length)} earlier</button>}
        </p>
      )}
      <div class="lg-scroll" role="region" aria-label="Ledger records">
        <table class="rtable lg-table">
          <caption class="sr-only">Ledger records</caption>
          <thead>
            <tr><th scope="col">#</th><th scope="col">Time</th><th scope="col">Record</th><th scope="col">Hash / prev</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {shown.map((i) => {
              const l = c[i], s = st?.[i];
              return (
                <tr key={l.seq} id={'lg-' + i} class={s === 'tampered' ? 'tampered' : s === 'broken' ? 'broken' : ''}>
                  <td data-l="#" class="num">{l.seq + 1}</td>
                  <td data-l="Time" class="num">{fmtT(l.body.simT)}</td>
                  <td data-l="Record">
                    <strong>{l.body.type}</strong> · <span class="nowrap">{l.body.plot}</span>
                    <span class="sub">{fmtData(l)}</span>
                  </td>
                  <td data-l="Hash"><span class="hash">{short(l.hash, 10)}</span><span class="sub hash"><span class="sr-only">previous </span>← {short(l.prev, 8)}</span></td>
                  <td data-l="Status">
                    {s === undefined ? <span class="muted">Not checked</span>
                      : s === 'ok' ? <span class="tag tag-ok"><Icon name="okShape" size={16} /> OK</span>
                      : s === 'tampered' ? <span class="tag tag-bad"><Icon name="barShape" size={16} /> Hash mismatch</span>
                      : <span class="tag tag-warn"><Icon name="halfShape" size={16} /> Broken link</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

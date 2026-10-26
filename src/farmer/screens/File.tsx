import { useState } from 'preact/hooks';
import { Icon, type IconName } from '../../ui/Icon';
import { tr, trr } from '../../lib/i18n';
import { fmtClock } from '../../lib/time';
import { showToast } from '../../lib/announce';
import { checkCode } from '../../lib/hash';
import { focusPlot, focusDet, model, activePlotId } from '../../sim/engine';
import { view, recordRef, policyNo } from '../focus';
import { screen } from '../nav';
import { cropName } from '../parts';

const STEPS: [string, IconName][] = [['fl.s1', 'phone'], ['fl.s2', 'volume'], ['fl.s3', 'shield'], ['fl.s4', 'file']];

/** The farmer's details for the officer, with Copy, and the steps to report. Shown before the receipt number is saved, and
 *  folded under the status once it is (one Report tab, audit S-06). */
export function ReportDetails() {
  const p = focusPlot.value!, d = focusDet.value!, m = model.value!;
  const v = view.value;
  const rows: [string, string][] = [
    [tr('fl.farmer'), p.name],
    [trr('reg.policy'), policyNo(p.id)],
    [tr('reg.plot'), `${p.id} · ${tr('reg.khasra')} ${p.khasra} · ${p.village}`],
    [tr('reg.crop'), `${cropName(p.crop)} · ${p.areaHa.toFixed(1)} ha`],
    [tr('fl.cause'), tr('fl.flood')],
    [tr('fl.event'), fmtClock(d.eventT!)],
    [trr('fl.deadline'), fmtClock(d.deadlineT!)],
    [tr('fl.check'), v.seal ? checkCode(v.seal.packetHash) : '—'],
  ];
  const text = `${m.raw.district}\n` + rows.map(([k, val]) => `${k}: ${val}`).join('\n') + '\n(SIMULATION · synthetic data)';

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      showToast(tr('fl.copied'), 'ok');
    } catch {
      showToast(tr('fl.copyFail'), 'warn');
    }
  }

  return (
    <>
      <section class="card summary" aria-labelledby="sum-h">
        <div class="row-between">
          <h3 id="sum-h">{tr('fl.summary')}</h3>
          <button type="button" class="pill pill-ghost pill-sm" onClick={copy}><Icon name="copy" size={18} /> {tr('fl.copy')}</button>
        </div>
        <dl class="facts">
          {rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}
        </dl>
      </section>
      <section aria-labelledby="steps-h">
        <h3 id="steps-h">{tr('fl.steps')}</h3>
        <ol class="howto" role="list">
          {STEPS.map(([k, icon], i) => (
            <li key={k}><span class="step-n num" aria-hidden="true">{i + 1}</span><Icon name={icon} /><span>{trr(k)}</span></li>
          ))}
        </ol>
      </section>
    </>
  );
}

/** Before the receipt number is saved: how to report, then the field for the number. */
export function FileClaim() {
  const p = focusPlot.value!;
  const [ref, setRef] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function save(e: Event) {
    e.preventDefault();
    const clean = ref.trim();
    if (!/^[A-Za-z0-9/-]{4,32}$/.test(clean)) { setErr(tr('fl.bad')); return; }
    setErr(null);
    await recordRef(clean);
    showToast(tr('fl.saved', { ref: clean.toUpperCase() }), 'ok');
    screen.value = 'status';
  }

  return (
    <>
      <h2 class="f-title">{activePlotId.value !== null ? trr('hm.flTitle', { farmer: p.name }) : trr('fl.title')}</h2>
      <p class="note note-plain"><Icon name="info" /><span>{trr('fl.intro')}</span></p>
      <ReportDetails />
      <form class="stack f-stack" onSubmit={save} noValidate>
        <label class="field">
          <span>{trr('fl.ref')}</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            value={ref}
            onInput={(e) => setRef((e.currentTarget as HTMLInputElement).value)}
            aria-describedby="ref-help"
            aria-invalid={!!err}
            class="input"
            placeholder="KR-2026-55821"
          />
          <small id="ref-help" class="f-help">{tr('fl.refHelp')}</small>
        </label>
        {err && <p class="note note-bad" role="alert"><Icon name="barShape" /><span>{err}</span></p>}
        <button type="submit" class="pill pill-primary pill-lg pill-block"><Icon name="check" /> {trr('fl.save')} <span class="arrow" aria-hidden="true">→</span></button>
      </form>
    </>
  );
}

import { Icon } from '../../ui/Icon';
import { tr, trr } from '../../lib/i18n';
import { rail } from '../../lib/prefs';
import { railHardDeadline } from '../../config';
import { fmtClock, officeHours } from '../../lib/time';
import { t, focusDet, model } from '../../sim/engine';
import { view, SCRIPT, fileObjection, type FocusView } from '../focus';
import type { Detection } from '../../sim/model';
import { FileClaim, ReportDetails } from './File';

type St = 'done' | 'wait' | 'overdue' | 'info';
interface Item { key: string; at: number | null; due?: number; st: St; note?: string }

export function focusTimeline(d: Detection, v: FocusView, now: number, hard = true): Item[] {
  // on the relief rail the window is advice: a step can be "best by" a time but is never overdue
  const due = hard ? d.deadlineT! : undefined;
  const s = (at: number | null, due?: number): St => (at !== null && at <= now ? 'done' : due !== undefined && now > due ? 'overdue' : 'wait');
  const allShots = v.shotCount >= 3 ? v.lastShotT : null;
  const synced = v.queued === 0 && v.shotCount ? v.syncedT : null;
  const ackT = v.ref ? v.ref.simT + SCRIPT.ack : null;
  const ackDue = v.ref ? v.ref.simT + SCRIPT.ackDue : undefined;
  const surveyT = ackT !== null ? officeHours(ackT + SCRIPT.survey) : null;
  return [
    { key: 'st.detected', at: d.detectT, st: s(d.detectT) },
    { key: 'st.alerted', at: d.alertT, st: s(d.alertT) },
    { key: 'st.captured', at: allShots, due: d.deadlineT!, st: s(allShots, due) },
    { key: 'st.synced', at: synced, due: d.deadlineT!, st: s(synced, due) },
    { key: 'st.filed', at: v.ref?.simT ?? null, due: d.deadlineT!, st: s(v.ref?.simT ?? null, due) },
    { key: 'st.ack', at: ackT !== null && ackT <= now ? ackT : null, due: ackDue, st: ackT !== null && ackT <= now ? 'done' : ackDue !== undefined && now > ackDue ? 'overdue' : 'wait' },
    { key: 'st.survey', at: null, st: surveyT !== null && ackT! <= now ? 'info' : 'wait', note: surveyT !== null && ackT! <= now ? tr('st.surveyAt', { time: fmtClock(surveyT) }) : undefined },
    { key: 'st.decision', at: null, st: 'wait', note: trr('st.decisionNote') },
  ];
}

export function focusReminders(d: Detection, v: FocusView, now: number, windowH = d.deadlineT! - d.eventT!): { at: number; key: string; tone: 'warn' | 'bad' | 'past' }[] {
  const out: { at: number; key: string; tone: 'warn' | 'bad' | 'past' }[] = [];
  const capBy = (h: number) => v.shotCount >= 3 && v.lastShotT! <= h;
  // second capture reminder two thirds of the way through the window (48 h into 72 h on the PMFBY rail)
  const r1 = d.alertT! + 6, r2 = d.eventT! + (windowH * 2) / 3;
  // a reminder whose subject has since been dealt with stays on the list as history, in a quiet tone
  const captured = v.shotCount >= 3;
  if (now >= r1 && !capBy(r1)) out.push({ at: r1, key: 'st.rCapture', tone: captured ? 'past' : 'warn' });
  if (now >= r2 && !capBy(r2)) out.push({ at: r2, key: 'st.rCapture', tone: captured ? 'past' : 'warn' });
  if (v.lastShotT !== null) {
    const rr = v.lastShotT + 12;
    if (now >= rr && !(v.ref && v.ref.simT <= rr)) out.push({ at: rr, key: 'st.rRef', tone: v.ref ? 'past' : 'warn' });
  }
  if (v.ref) {
    const due = v.ref.simT + SCRIPT.ackDue, esc = v.ref.simT + SCRIPT.escalate, ack = v.ref.simT + SCRIPT.ack;
    if (now >= due && ack > due) out.push({ at: due, key: 'st.rAck', tone: now >= ack ? 'past' : 'warn' });
    if (now >= esc && ack > esc) out.push({ at: esc, key: 'st.escalated', tone: now >= ack ? 'past' : 'bad' });
  }
  return out;
}

const ICON: Record<St, 'check' | 'clock' | 'alert' | 'info'> = { done: 'check', wait: 'clock', overdue: 'alert', info: 'info' };

/**
 * Relief rail: after the officer publishes the draft list (outside Saboot, simulated), the farmer may attach their sealed
 * evidence to their entry until the objection window closes. Saboot only attaches it. The officer decides.
 */
function ObjectionCard() {
  const m = model.value!, now = t.value, v = view.value;
  const pub = m.opts.publishAtHour, end = pub + m.opts.objectionWindowHours;
  const obj = v.objection;
  const respT = obj ? obj.simT + SCRIPT.objectionResponse : null;
  return (
    <section class="ob-card stack f-stack" aria-labelledby="ob-h" data-objection={obj ? 'filed' : now < pub ? 'soon' : now < end ? 'open' : 'closed'}>
      <h3 id="ob-h">{tr('ob.title')}</h3>
      {obj ? (
        <>
          <p class="note note-ok" role="status"><Icon name="okShape" /><span>{tr('ob.filed', { time: fmtClock(obj.simT) })}</span></p>
          {respT !== null && respT <= now && <p class="note note-plain"><Icon name="info" /><span>{tr('ob.answered', { time: fmtClock(respT) })}</span></p>}
        </>
      ) : now < pub ? (
        <p class="f-help">{tr('ob.soon', { time: fmtClock(pub), until: fmtClock(end) })}</p>
      ) : now < end ? (
        <>
          <p>{tr('ob.open', { until: fmtClock(end) })}</p>
          {v.seal ? (
            <button type="button" class="pill pill-primary pill-lg pill-block" onClick={() => void fileObjection()}><Icon name="shield" /> {tr('ob.attach')}</button>
          ) : (
            <p class="f-help">{tr('ob.needSeal')}</p>
          )}
        </>
      ) : (
        <p class="f-help">{tr('ob.closed')}</p>
      )}
    </section>
  );
}

/**
 * The Report tab (audit S-06): one place for reporting and for what happens after. Before the receipt or reference number is
 * saved it starts with how to report and the field for the number, and the status follows; once it is saved the status comes
 * first and the details fold away underneath. The 'file' screen id still opens it.
 */
export function Status() {
  const d = focusDet.value!, v = view.value, now = t.value;
  const hard = railHardDeadline(rail.value);
  const items = focusTimeline(d, v, now, hard);
  const rem = focusReminders(d, v, now);
  const filed = !!v.ref;
  const track = (
    <>
      {filed ? <h2 class="f-title">{trr('st.title')}</h2> : <h3 class="st-h">{trr('st.title')}</h3>}
      {v.ref && <p class="note note-ok"><Icon name="okShape" /><span>{tr('fl.saved', { ref: v.ref.ref })} · <span class="num">{fmtClock(v.ref.simT)}</span></span></p>}
      <p class="note note-plain"><Icon name="scale" /><span>{trr('st.note')}</span></p>
      <ol class="tl" role="list">
        {items.map((it) => (
          <li key={it.key} class={'tl-' + it.st}>
            <span class="tl-dot" aria-hidden="true"><Icon name={ICON[it.st]} size={16} /></span>
            <div>
              <strong>{trr(it.key)}</strong>
              <span class="tl-when num">
                {it.st === 'done' && it.at !== null ? fmtClock(it.at)
                  : it.st === 'overdue' ? tr('st.overdue')
                  : it.due !== undefined ? trr('st.due', { time: fmtClock(it.due) })
                  : it.note ? '' : tr('st.waiting')}
              </span>
              {it.note && <span class="tl-note">{it.note}</span>}
            </div>
          </li>
        ))}
      </ol>
      {rail.value === 'relief' && <ObjectionCard />}
      <section aria-labelledby="rem-h">
        <h3 id="rem-h">{tr('st.reminders')}</h3>
        {rem.length ? (
          <ul class="reminders" role="list">
            {rem.map((r) => (
              <li key={r.key + r.at} class={r.tone}>
                <Icon name={r.tone === 'bad' ? 'flag' : 'phone'} size={18} />
                <span>{trr(r.key)}</span>
                <time class="num">{fmtClock(r.at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p class="f-help">{tr('st.none')}</p>
        )}
      </section>
    </>
  );
  return (
    <div class="stack f-stack">
      {filed ? (
        <>
          {track}
          <details class="pk-tech" data-report-details>
            <summary><Icon name="file" /> <span>{tr('fl.again')}</span></summary>
            <div class="stack"><ReportDetails /></div>
          </details>
        </>
      ) : (
        <>
          <FileClaim />
          {track}
        </>
      )}
    </div>
  );
}

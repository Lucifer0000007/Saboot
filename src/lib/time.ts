// Simulated time is hours since T0. Wall-clock display is fixed to IST (+05:30), the scenario's zone.
import { tr, tList } from './i18n';
import en from '../i18n/en';
import { SCENARIO } from '../generated/scenario-summary';

export const T0_MS = Date.parse(SCENARIO.t0);
const IST = 5.5 * 3600e3;

export function simParts(h: number) {
  const d = new Date(T0_MS + h * 3600e3 + IST);
  return { dow: d.getUTCDay(), day: d.getUTCDate(), mon: d.getUTCMonth(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
}

const p2 = (n: number) => String(n).padStart(2, '0');

/** "Tue 14 Jul, 11:00" — day/month names come from the i18n dictionary (font subsets cover them).
 *  `english` forces English names (the insurer/district console is English in every language). */
export function fmtClock(h: number, withDay = true, english = false) {
  const p = simParts(h);
  const t = `${p2(p.hh)}:${p2(p.mm)}`;
  if (!withDay) return t;
  const days = english ? (en.days as string[]) : tList('days');
  const months = english ? (en.months as string[]) : tList('months');
  return `${days[p.dow]} ${p.day} ${months[p.mon]}, ${t}`;
}

/** Hours → "3d 4h" / "5h 20m" / "12m" */
export function fmtDur(hours: number, english = false) {
  const neg = hours < 0;
  let m = Math.round(Math.abs(hours) * 60);
  const d = Math.floor(m / 1440); m -= d * 1440;
  const hh = Math.floor(m / 60); m -= hh * 60;
  const u = english ? { d: 'd', h: 'h', m: 'm' } : { d: tr('u.d'), h: tr('u.h'), m: tr('u.m') };
  const s = d ? `${d}${u.d} ${hh}${u.h}` : hh ? `${hh}${u.h} ${p2(m)}${u.m}` : `${m}${u.m}`;
  return (neg ? '−' : '') + s;
}

/**
 * The advice window in words: "about 1 day 20 h", "about 20 h", "about 45 min". For the relief rail, where the window is
 * advice and not a deadline: no ticking seconds, nothing that reads as a time of day. Rounded to the nearest 10 minutes
 * under an hour and to the hour above it, which is as exact as advice should sound.
 */
export function fmtCountdownWords(hoursLeft: number, english = false) {
  const t = (k: string) => (english ? (en[k] as string) : tr(k));
  if (hoursLeft <= 0) return t('al.passedWords');
  const total = Math.round(hoursLeft * 6) / 6; // tenths of an hour
  const d = Math.floor(total / 24);
  const h = Math.round(total - d * 24);
  const body = d >= 1
    ? `${d} ${t(d === 1 ? 'u.day' : 'u.days')}${h ? ` ${h} ${t('u.h')}` : ''}`
    : total >= 1
      ? `${Math.round(total)} ${t('u.h')}`
      : `${Math.max(10, Math.round((total * 60) / 10) * 10)} ${t('u.min')}`;
  return t('al.about').split('{t}').join(body);
}

/** Countdown "HH:MM:SS", hours may exceed 24. */
export function fmtCountdown(hoursLeft: number) {
  const s = Math.max(0, Math.floor(hoursLeft * 3600));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}

/** Scenario-relative label "T+14h 15m" */
export function fmtT(h: number) {
  const m = Math.round(h * 60);
  const d = Math.floor(m / 1440);
  const hh = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return `T+${d ? d + 'd ' : ''}${hh}h${mm ? ' ' + p2(mm) + 'm' : ''}`;
}

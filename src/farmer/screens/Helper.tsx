// Helper mode: the queue of farmers one helper captures for on this phone. Each farmer gives their own consent, and each
// farmer's photos and sealed packet live in that farmer's own log, with the helper named on every photo.
import { useState } from 'preact/hooks';
import { Icon, type IconName } from '../../ui/Icon';
import { lazy } from '../../lib/lazy';
import { tr } from '../../lib/i18n';
import { fmtClock } from '../../lib/time';
import { helperSession, startHelperSession } from '../focus';
import { queue, doneCount, HELPER_ROLES, openFarmer, leaveHelperMode, jumpToFirstAlert, type QueueState } from '../helper';
import { cropName } from '../parts';

const FeaturePhone = lazy(() => import('../FeaturePhone'), 0);

const META: Record<QueueState, { icon: IconName; key: string; tone: string }> = {
  'no-alert': { icon: 'clock', key: 'hm.s.noalert', tone: '' },
  consent: { icon: 'hand', key: 'hm.s.consent', tone: 'tag-warn' },
  ready: { icon: 'camera', key: 'hm.s.ready', tone: 'tag-warn' },
  photos: { icon: 'camera', key: 'hm.s.photos', tone: 'tag-warn' },
  sealed: { icon: 'okShape', key: 'hm.s.sealed', tone: 'tag-ok' },
  'no-damage': { icon: 'okShape', key: 'hm.s.nodamage', tone: 'tag-ok' },
};

function Start() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(HELPER_ROLES[0]);
  const [err, setErr] = useState<string | null>(null);
  async function go(e: Event) {
    e.preventDefault();
    if (!name.trim()) { setErr(tr('hm.needName')); return; }
    setErr(null);
    await startHelperSession({ name: name.trim(), role: tr(role) });
  }
  return (
    <form class="stack f-stack" onSubmit={go} noValidate>
      <label class="field">
        <span>{tr('hm.name')}</span>
        <input type="text" class="input" value={name} autoComplete="off" aria-invalid={!!err} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} />
      </label>
      <fieldset class="field">
        <legend>{tr('hm.role')}</legend>
        <div class="radios" role="presentation">
          {HELPER_ROLES.map((r) => (
            <label key={r} class="radio">
              <input type="radio" name="hm-role" checked={role === r} onChange={() => setRole(r)} />
              <span>{tr(r)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {err && <p class="note note-bad" role="alert"><Icon name="barShape" /><span>{err}</span></p>}
      <button type="submit" class="pill pill-primary pill-lg pill-block"><Icon name="users" /> {tr('hm.start')} <span class="arrow" aria-hidden="true">→</span></button>
    </form>
  );
}

export function Helper() {
  const session = helperSession.value;
  const list = queue.value;
  const [phone, setPhone] = useState(false);
  return (
    <div class="stack f-stack" data-helper-screen>
      <h2 class="f-title">{tr('hm.title')}</h2>
      {/* once the session runs, the queue comes first: the introduction has done its job (audit H13) */}
      {!session && <p>{tr('hm.intro')}</p>}
      {!session ? (
        <Start />
      ) : (
        <>
          <div class="hs-head">
            <p class="tag" data-helper-name><Icon name="users" size={16} /> {tr('hm.session', { name: session.name, role: session.role })}</p>
            <p class="hs-progress" role="status">{tr('hm.progress', { done: doneCount.value, n: list.length })}</p>
          </div>
          {list.length > 0 && list.every((q) => q.state === 'no-alert') && (
            <button type="button" class="pill pill-primary pill-lg pill-block" data-jump-alert onClick={jumpToFirstAlert}>
              <Icon name="clock" /> {tr('hm.jumpAlert')} <span class="arrow" aria-hidden="true">→</span>
            </button>
          )}
          <ol class="hq" role="list" aria-label={tr('hm.queue')}>
            {list.map((q) => {
              const m = META[q.state];
              const label = q.state === 'photos' ? tr(m.key, { n: q.shots }) : tr(m.key);
              const action = q.state === 'consent' || q.state === 'no-alert' ? 'hm.a.start' : q.state === 'sealed' || q.state === 'no-damage' ? 'hm.a.view' : 'hm.a.continue';
              return (
                <li key={q.plot.id} class={'hq-' + q.state} data-farmer={q.plot.id}>
                  <div class="hq-main">
                    <strong>{q.plot.name}</strong>
                    <span class="sub">{q.plot.id} · {q.plot.village} · {cropName(q.plot.crop)} · <span class="nb">{q.plot.areaHa.toFixed(1)} ha</span></span>
                    <span class="sub">{tr('hm.speaks', { lang: tr('lang.name.' + q.plot.lang) })}</span>
                    {q.by && <span class="sub" data-captured-by>{tr('hm.by', { name: q.by.name, role: q.by.role })}{q.consentT !== null && <> <span class="nb">· <span class="num">{fmtClock(q.consentT, false)}</span></span></>}</span>}
                  </div>
                  <span class={'tag tag-flow ' + m.tone}><Icon name={m.icon} size={16} /> {label}</span>
                  {q.waiting > 0 && <span class="tag tag-flow" data-waiting><Icon name="clock" size={16} /> {tr('pk.queued', { n: q.waiting })}</span>}
                  {q.state === 'no-alert' && <span class="sub">{tr('hm.wait')}</span>}
                  <button type="button" class="pill pill-ghost" disabled={q.state === 'no-alert'} onClick={() => openFarmer(q.plot.id, q.state)}>
                    {tr(action)}<span class="sr-only"> · {q.plot.name}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p class="note note-plain"><Icon name="shield" /><span>{tr('hm.note')}</span></p>
          <p class="note note-plain" data-replay-paused><Icon name="clock" /><span>{tr('hm.paused')}</span></p>
          <button type="button" class="link-arrow" data-fp-open onClick={() => setPhone(true)}><Icon name="phone" size={18} /> {tr('hm.phoneBtn')} <span aria-hidden="true">→</span></button>
          <button type="button" class="pill pill-ghost" onClick={() => void leaveHelperMode()}>{tr('hm.end')}</button>
        </>
      )}
      {!session && <button type="button" class="link-arrow" data-fp-open onClick={() => setPhone(true)}><Icon name="phone" size={18} /> {tr('hm.phoneBtn')} <span aria-hidden="true">→</span></button>}
      {phone && <FeaturePhone onClose={() => setPhone(false)} />}
    </div>
  );
}

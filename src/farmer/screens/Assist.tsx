import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../ui/Icon';
import { tr, trr, trIn, langIn, langReady, prefetchLang } from '../../lib/i18n';
import { fmtClock } from '../../lib/time';
import { sha256 } from '../../lib/hash';
import { dbSet } from '../../lib/db';
import { showToast } from '../../lib/announce';
import { focusPlot, activePlotId } from '../../sim/engine';
import { view, recordConsent, helperSession, reportNoDamage, activeKey } from '../focus';
import { screen } from '../nav';
import { backToQueue } from '../helper';
import { VoiceCaption } from '../parts';

const ROLES = ['as.family', 'as.volunteer', 'as.bank'];
const HOLD_MS = 2000;

export function Assist() {
  const p = focusPlot.value!;
  const v = view.value;
  // in helper mode the helper is already known: the session holds their name and role
  const session = helperSession.value;
  const inHelper = activePlotId.value !== null;
  const [name, setName] = useState(session?.name ?? '');
  const [role, setRole] = useState(ROLES[0]);
  const [hold, setHold] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const raf = useRef(0);
  const start = useRef(0);
  const mic = useRef<{ r: MediaRecorder; stream: MediaStream } | null>(null);
  const gone = useRef(false);
  // A helper reads the consent to the farmer in the language the farmer speaks, whatever the phone's language (audit H5).
  // On the farmer's own phone the page is already in the farmer's language.
  useEffect(() => { if (inHelper) void prefetchLang(p.lang); }, [inHelper, p.lang]);
  const cl = inHelper ? langIn(p.lang) : langReady.value;
  // Leaving the screen ends the hold and the recording, and switches the microphone off. A recording the person walked away
  // from is not consent, so it is dropped, not saved.
  useEffect(() => () => {
    gone.current = true;
    cancelAnimationFrame(raf.current);
    const m = mic.current;
    if (!m) return;
    m.r.onstop = null;
    m.r.ondataavailable = null;
    if (m.r.state !== 'inactive') m.r.stop();
    m.stream.getTracks().forEach((x) => x.stop());
    mic.current = null;
  }, []);

  if (v.consent) {
    return (
      <div class="stack f-stack">
        <h2 class="f-title">{tr('as.title')}</h2>
        <p class="note note-ok" role="status"><Icon name="okShape" /><span>{tr('as.done', { time: fmtClock(v.consent.simT) })}</span></p>
        <blockquote class={'consent in-' + (v.consent.lang ?? 'en')} lang={v.consent.lang}>{v.consent.text}</blockquote>
        <p class="f-help">{v.consent.method === 'voice' ? tr('as.voiceSha', { h: (v.consent.audioSha ?? '').slice(0, 12) + '…' }) : tr('as.holdMethod')}</p>
        {v.noDamage !== null ? (
          <>
            <p class="note note-ok" role="status"><Icon name="okShape" /><span>{tr('hm.s.nodamage')}</span></p>
            <button type="button" class="pill pill-ghost" onClick={() => reportNoDamage(true)}>{tr('al.undo')}</button>
          </>
        ) : (
          <>
            <button type="button" class="pill pill-primary pill-lg pill-block" onClick={() => (screen.value = 'capture')}>
              <Icon name="camera" /> {tr('as.start')} <span class="arrow" aria-hidden="true">→</span>
            </button>
            {inHelper && (
              <button type="button" class="pill pill-ghost" onClick={async () => { await reportNoDamage(); backToQueue(); }}>
                <Icon name="check" /> {tr('hm.noDamage')}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const helper = name.trim();
  const text = trIn(cl, 'as.consentText', { farmer: p.name, helper: helper || '…' });
  // the same words in the phone's language, for a helper who does not read the farmer's script
  const other = cl !== langReady.value;

  function ready() {
    if (!helper) { setErr(tr('as.needName')); return false; }
    setErr(null);
    return true;
  }

  // the farmer whose consent it is is fixed when the hold or the recording starts: moving on to another farmer while it
  // is saved must not put this farmer's words in that farmer's log (audit CC-05)
  async function commit(key: string, method: 'hold' | 'voice', audioSha?: string) {
    await recordConsent({ farmer: p.name, helper, role: session ? session.role : tr(role), method, audioSha, text, lang: cl }, key);
    showToast(tr('as.doneToast'), 'ok');
  }

  function begin() {
    if (!ready()) return;
    const key = activeKey.value;
    start.current = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start.current) / HOLD_MS);
      setHold(k);
      // a consent that could not be stored is not consent: say so and empty the ring, so the person can hold again
      if (k >= 1) { commit(key, 'hold').catch(() => { setErr(tr('as.saveFail')); setHold(0); }); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }
  function end() {
    cancelAnimationFrame(raf.current);
    setHold((h) => (h >= 1 ? h : 0));
  }

  async function toggleRec() {
    if (rec) { rec.stop(); return; }
    if (!ready()) return;
    const key = activeKey.value;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // the person left while the phone asked for the microphone: the answer must not leave it on
      if (gone.current) { stream.getTracks().forEach((x) => x.stop()); return; }
      const r = new MediaRecorder(stream);
      const parts: Blob[] = [];
      r.ondataavailable = (e) => parts.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((x) => x.stop());
        mic.current = null;
        setRec(null);
        const blob = new Blob(parts, { type: r.mimeType });
        try {
          const h = await sha256(blob);
          // the helper left this farmer while the recording was being saved: it is not consent, so it is dropped
          if (gone.current || activeKey.value !== key) return;
          await dbSet('photos', 'consent-' + h.slice(0, 16), blob);
          await commit(key, 'voice', h);
        } catch {
          setErr(tr('as.saveFail'));
        }
      };
      r.start();
      mic.current = { r, stream };
      setRec(r);
    } catch {
      showToast(tr('as.noMic'), 'warn');
    }
  }

  return (
    <div class="stack f-stack">
      <h2 class="f-title">{inHelper ? tr('hm.consentTitle', { farmer: p.name.replace(/ /g, '\u00a0') }) : tr('as.title')}</h2>
      <p>{inHelper ? tr('hm.consentIntro', { farmer: p.name }) : tr('as.intro')}</p>
      {session ? (
        <p class="tag tag-flow" data-helper-name><Icon name="users" size={16} /> {tr('hm.session', { name: session.name, role: session.role })}</p>
      ) : (
        <label class="field">
          <span>{tr('as.name')}</span>
          <input type="text" class="input" value={name} autoComplete="off" onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} />
        </label>
      )}
      {!session && <fieldset class="field">
        <legend>{tr('as.role')}</legend>
        <div class="radios" role="presentation">
          {ROLES.map((r) => (
            <label key={r} class="radio">
              <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
              <span>{tr(r)}</span>
            </label>
          ))}
        </div>
      </fieldset>}
      <section class="card consent-card" aria-labelledby="cons-h">
        <h3 id="cons-h">{tr('as.consent')}{other && <> · {tr('lang.name.' + cl)}</>}</h3>
        <div class={'stack in-' + cl} lang={cl} data-consent-farmer>
          <VoiceCaption id="consent" text={text} lang={cl} />
          <h4>{trIn(cl, 'as.means')}</h4>
          <ul class="means" data-consent-means>
            <li>{trIn(cl, 'as.means1')}</li>
            <li>{trIn(cl, 'as.means2')}</li>
            <li>{trIn(cl, 'as.means3')}</li>
          </ul>
        </div>
        {other && (
          <details class="k-code" data-consent-ui>
            <summary><span>{tr('as.uiCopy', { lang: tr('lang.name.' + langReady.value) })}</span><Icon name="down" /></summary>
            <p>{tr('as.consentText', { farmer: p.name, helper: helper || '…' })}</p>
            <ul class="means">
              <li>{tr('as.means1')}</li>
              <li>{trr('as.means2')}</li>
              <li>{tr('as.means3')}</li>
            </ul>
          </details>
        )}
      </section>
      {err && <p class="note note-bad" role="alert"><Icon name="barShape" /><span>{err}</span></p>}
      <button
        type="button"
        class="pill pill-primary pill-lg pill-block hold"
        style={{ '--k': hold } as Record<string, number>}
        onPointerDown={begin}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') end(); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Icon name="hand" /> {hold > 0 && hold < 1 ? tr('as.holding') : tr('as.hold')}
      </button>
      {'MediaRecorder' in window && (
        <button type="button" class={'pill pill-ghost' + (rec ? ' rec' : '')} aria-pressed={!!rec} onClick={toggleRec}>
          <Icon name="mic" /> {rec ? tr('as.recording') : tr('as.record')}
        </button>
      )}
    </div>
  );
}

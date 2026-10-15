// A farmer without a smartphone: a DESIGN SIMULATION of the voice-call and keypad flow. Nothing here places a real call or
// sends an SMS or WhatsApp message, and it changes none of the replay's state. It shows how the flow would work:
// a missed call asks for a call back, the call reads the alert with captions, key 1 means damage, key 2 means no damage,
// and a helper with a smartphone records the photos on the farmer's behalf, with the farmer's consent sealed.
import { useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { Sheet } from '../ui/Sheet';
import { tr } from '../lib/i18n';
import { backToQueue } from './helper';
import { VoiceCaption } from './parts';

type Outcome = '1' | '2' | 'other' | null;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
const STEPS = ['fp.s1', 'fp.s2', 'fp.s3', 'fp.s4'] as const;
/** What the design would write into the log for each key. A record, so it stays in English in every language. */
const LOG: Record<'1' | '2', string> = {
  '1': 'event: farmer_reply\nkey: 1 (damage)\naction: helper_visit_requested\nvia: voice_call (design simulation)',
  '2': 'event: farmer_reply\nkey: 2 (no damage)\naction: none\nvia: voice_call (design simulation)',
};

export default function FeaturePhone({ onClose }: { onClose: () => void }) {
  const [called, setCalled] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const step = !called ? 0 : outcome === '1' ? 3 : outcome === '2' ? 2 : 1;

  function press(k: string) {
    setOutcome(k === '1' ? '1' : k === '2' ? '2' : 'other');
  }
  function openHelper() {
    onClose();
    backToQueue();
  }
  function again() {
    setCalled(false);
    setOutcome(null);
  }

  return (
    <Sheet title={tr('fp.title')} onClose={onClose} closeLabel={tr('set.close')} class="fphone-sheet" headSub={<span class="tag tag-flow tag-design"><Icon name="info" size={16} /> {tr('fp.badge')}</span>}>
      <p class="note note-plain"><Icon name="shield" /><span>{tr('fp.note')}</span></p>
      <ol class="fp-steps" role="list" aria-label={tr('fp.stepsLabel')}>
        {STEPS.map((k, i) => (
          <li key={k} class={i < step ? 'done' : i === step ? 'cur' : ''} aria-current={i === step ? 'step' : undefined}>
            <span class="dot num">{i < step ? <Icon name="check" size={16} /> : i + 1}</span>
            <span>{tr(k)}</span>
          </li>
        ))}
      </ol>

      {!called ? (
        <section class="fp-card" aria-labelledby="fp-h1">
          <h3 id="fp-h1">{tr('fp.s1')}</h3>
          <p>{tr('fp.s1.b')}</p>
          <button type="button" class="pill pill-primary pill-lg pill-block" data-fp-call onClick={() => setCalled(true)}>
            <Icon name="phone" /> {tr('fp.call')} <span class="arrow" aria-hidden="true">→</span>
          </button>
        </section>
      ) : (
        <>
          <section class="fp-phone" aria-labelledby="fp-h2">
            <h3 id="fp-h2">{tr('fp.s2')}</h3>
            <div class="fp-screen" role="status" aria-live="polite">
              <p class="fp-incoming"><Icon name="phone" size={18} /> {tr('fp.incoming')}</p>
              <p class="fp-line">{outcome === '1' ? tr('fp.k1') : outcome === '2' ? tr('fp.k2') : outcome === 'other' ? tr('fp.kother') : tr('fp.press')}</p>
            </div>
            <VoiceCaption id="fp" text={tr('fp.prompt')} label={tr('fp.play')} />
            <div class="keypad" role="group" aria-label={tr('fp.keypad')}>
              {KEYS.map((k) => (
                <button key={k} type="button" class={'key-btn' + (outcome === k ? ' on' : '')} aria-pressed={outcome === k} onClick={() => press(k)} data-key={k}>
                  <span class="key-n num">{k}</span>
                  {k === '1' && <span class="key-h">{tr('fp.key1')}</span>}
                  {k === '2' && <span class="key-h">{tr('fp.key2')}</span>}
                </button>
              ))}
            </div>
          </section>

          {(outcome === '1' || outcome === '2') && (
            <section class="fp-card" aria-labelledby="fp-h3" data-fp-outcome={outcome}>
              <h3 id="fp-h3">{outcome === '1' ? tr('fp.s4') : tr('fp.s3')}</h3>
              <p class="note note-ok"><Icon name="okShape" /><span>{outcome === '1' ? tr('fp.out1') : tr('fp.out2')}</span></p>
              <p class="f-help">{tr('fp.logHead')}</p>
              <pre class="fp-log" tabIndex={0} aria-label={tr('fp.logHead')}>{LOG[outcome]}</pre>
              {outcome === '1' && (
                <>
                  <p>{tr('fp.helper')}</p>
                  <button type="button" class="pill pill-primary pill-lg pill-block" onClick={openHelper}>
                    <Icon name="users" /> {tr('fp.open')} <span class="arrow" aria-hidden="true">→</span>
                  </button>
                </>
              )}
            </section>
          )}
          <button type="button" class="pill pill-ghost" onClick={again}>{tr('fp.again')}</button>
        </>
      )}
    </Sheet>
  );
}

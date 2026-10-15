// The process choice (relief assessment or PMFBY intimation) and the radar cadence, as two small segmented controls.
// Saboot is one evidence core with two rails; the choice changes the wording, the capture window and the console
// labels, never what the rules detect (docs/SABOOT-SPEC.md, section 14).
import { tr } from '../lib/i18n';
import { rail, cadence } from '../lib/prefs';
import { RAILS, PMFBY } from '../config';
import { SCENARIO } from '../generated/scenario-summary';

export function RailSwitch({ compact }: { compact?: boolean }) {
  return (
    <div class={'rail' + (compact ? ' compact' : '')} data-tour="rail">
      <div class="rail-row">
        <span class="rail-l" id="rail-l">{tr('rail.label')}</span>
        <div class="seg rail-seg" role="radiogroup" aria-labelledby="rail-l" aria-label={tr('rail.group')}>
          {RAILS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={rail.value === r} onClick={() => (rail.value = r)}>
              <span>{tr('rail.' + r)}</span>
            </button>
          ))}
        </div>
      </div>
      {!compact && <p class="rail-d">{tr('rail.d.' + rail.value, { state: PMFBY.state })}</p>}
    </div>
  );
}

/** Radar pass cadence: the 12-hour demo, or the slower few-days option. Both are simulated. */
export function CadenceSwitch({ compact }: { compact?: boolean }) {
  return (
    <div class={'rail cadence' + (compact ? ' compact' : '')}>
      <div class="rail-row">
        <span class="rail-l" id="cad-l">{tr('cad.label')}</span>
        <div class="seg rail-seg" role="radiogroup" aria-labelledby="cad-l">
          <button type="button" role="radio" aria-checked={cadence.value === 'demo'} onClick={() => (cadence.value = 'demo')}>
            <span>{tr('cad.demo', { n: SCENARIO.radarCadenceHours })}</span>
          </button>
          <button type="button" role="radio" aria-checked={cadence.value === 'slow'} onClick={() => (cadence.value = 'slow')}>
            <span>{tr('cad.slow', { n: SCENARIO.radarSlowCadenceHours })}</span>
          </button>
        </div>
      </div>
      {!compact && <p class="rail-d">{tr('cad.d')}</p>}
    </div>
  );
}

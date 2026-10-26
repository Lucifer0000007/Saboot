// Farmer settings sheet: language, text size (+25% / +50%), voice mode, low-data mode, high contrast.
import { useState } from 'preact/hooks';
import type { Signal } from '@preact/signals';
import { Icon, type IconName } from './Icon';
import { Sheet } from './Sheet';
import { tr, setLang, LANGS, langReady } from '../lib/i18n';
import { textScale, voiceMode, lowData, highContrast, theme, type TextScale, type Theme } from '../lib/prefs';
import { stopVoice } from '../lib/voice';
import { settingsOpen } from '../farmer/nav';
import { exportMyData, deleteMyData, exportFarmerData, deleteFarmerData } from '../farmer/focus';
import { backToQueue } from '../farmer/helper';
import { activePlotId, focusPlot } from '../sim/engine';
import { download } from '../lib/download';
import { showToast } from '../lib/announce';
import { buildLabel } from '../lib/build';

function Toggle({ sig, label, help, icon, onChange }: { sig: Signal<boolean>; label: string; help?: string; icon: IconName; onChange?: (v: boolean) => void }) {
  return (
    <label class="set-row">
      <Icon name={icon} />
      <span class="set-text">
        <span>{label}</span>
        {help && <small>{help}</small>}
      </span>
      <span class="switch">
        <input type="checkbox" role="switch" checked={sig.value} aria-checked={sig.value} onChange={(e) => { sig.value = (e.currentTarget as HTMLInputElement).checked; onChange?.(sig.value); }} />
      </span>
    </label>
  );
}

/** Take a copy of, or delete, what this phone holds. Photos, consent and sealed packets never leave it by themselves. */
function YourData() {
  const [ask, setAsk] = useState(false);
  async function del() {
    await deleteMyData();
    setAsk(false);
    showToast(tr('set.deleted'), 'ok');
  }
  return (
    <fieldset class="set-group" data-your-data>
      <legend><Icon name="shield" /> {tr('set.data')}</legend>
      <p class="f-help">{tr('set.dataHelp')}</p>
      <button type="button" class="pill pill-ghost pill-block" data-export-data onClick={() => download('saboot-my-data.json', JSON.stringify(exportMyData(), null, 2) + '\n', 'application/json')}>
        <Icon name="download" /> {tr('set.export')}
      </button>
      {!ask ? (
        <button type="button" class="pill pill-ghost pill-block" data-delete-data onClick={() => setAsk(true)}><Icon name="x" /> {tr('set.delete')}</button>
      ) : (
        <div class="note note-warn" role="alert" data-delete-ask>
          <Icon name="alert" />
          <span>{tr('set.deleteAsk')}</span>
          <div class="row">
            <button type="button" class="pill pill-dark" data-delete-yes onClick={del}>{tr('set.deleteYes')}</button>
            <button type="button" class="pill pill-ghost" onClick={() => setAsk(false)}>{tr('set.deleteNo')}</button>
          </div>
        </div>
      )}
    </fieldset>
  );
}

/**
 * In helper mode, the farmer on screen can ask for a copy of their own data, or for it to be deleted, without touching any
 * other farmer's evidence on the phone (as.means3, audit H10).
 */
function FarmerData({ id, name }: { id: string; name: string }) {
  const [ask, setAsk] = useState(false);
  async function del() {
    await deleteFarmerData(id);
    setAsk(false);
    settingsOpen.value = false;
    backToQueue();
    showToast(tr('set.farmerDeleted', { farmer: name }), 'ok');
  }
  return (
    <fieldset class="set-group" data-farmer-data>
      <legend><Icon name="users" /> {tr('set.farmerData', { farmer: name })}</legend>
      <p class="f-help">{tr('set.farmerDataHelp', { farmer: name })}</p>
      <button type="button" class="pill pill-ghost pill-block" data-farmer-export onClick={() => download(`saboot-data-${id}.json`, JSON.stringify(exportFarmerData(id), null, 2) + '\n', 'application/json')}>
        <Icon name="download" /> {tr('set.farmerExport', { farmer: name })}
      </button>
      {!ask ? (
        <button type="button" class="pill pill-ghost pill-block" data-farmer-delete onClick={() => setAsk(true)}><Icon name="x" /> {tr('set.farmerDelete', { farmer: name })}</button>
      ) : (
        <div class="note note-warn" role="alert" data-farmer-delete-ask>
          <Icon name="alert" />
          <div class="stack">
            <span>{tr('set.farmerDeleteAsk', { farmer: name })}</span>
            <div class="row">
              <button type="button" class="pill pill-dark" data-farmer-delete-yes onClick={del}>{tr('set.deleteYes')}</button>
              <button type="button" class="pill pill-ghost" onClick={() => setAsk(false)}>{tr('set.farmerKeep')}</button>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}

export function Settings() {
  if (!settingsOpen.value) return null;
  return (
    <Sheet title={tr('set.title')} onClose={() => (settingsOpen.value = false)} closeLabel={tr('set.close')} class="set-sheet">
      <fieldset class="set-group">
        <legend><Icon name="globe" /> {tr('set.lang')}</legend>
        <div class="seg" role="radiogroup" aria-label={tr('set.lang')}>
          {LANGS.map((l) => (
            <button key={l.id} type="button" role="radio" lang={l.bcp} aria-checked={langReady.value === l.id} onClick={() => setLang(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset class="set-group">
        <legend><Icon name="text" /> {tr('set.text')}</legend>
        <div class="seg" role="radiogroup" aria-label={tr('set.text')}>
          {([100, 125, 150] as TextScale[]).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={textScale.value === s} onClick={() => (textScale.value = s)}>
              {tr('set.t' + s)}
            </button>
          ))}
        </div>
      </fieldset>
      <Toggle sig={voiceMode} label={tr('set.voice')} help={tr('set.voiceHelp')} icon="volume" onChange={(v) => !v && stopVoice()} />
      <Toggle sig={lowData} label={tr('set.lowData')} help={tr('set.lowDataHelp')} icon="download" />
      <fieldset class="set-group">
        <legend><Icon name="eye" /> {tr('set.theme')}</legend>
        <div class="seg" role="radiogroup" aria-label={tr('set.theme')}>
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={theme.value === t} onClick={() => (theme.value = t)}>
              {tr('set.theme.' + t)}
            </button>
          ))}
        </div>
      </fieldset>
      <Toggle sig={highContrast} label={tr('set.contrast')} icon="eye" />
      {activePlotId.value !== null && focusPlot.value && <FarmerData id={activePlotId.value} name={focusPlot.value.name} />}
      <YourData />
      <p class="small muted set-build">{tr('foot.build', { b: buildLabel() })}</p>
      <button type="button" class="pill pill-dark pill-block" onClick={() => (settingsOpen.value = false)}>{tr('set.close')}</button>
    </Sheet>
  );
}

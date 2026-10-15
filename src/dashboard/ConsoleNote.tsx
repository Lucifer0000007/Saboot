// Shown above English-only console views when the page language is Hindi or Punjabi.
import { Icon } from '../ui/Icon';
import { trr, langReady, LANGS } from '../lib/i18n';

export function ConsoleNote() {
  if (langReady.value === 'en') return null;
  const l = LANGS.find((x) => x.id === langReady.value)!;
  return <p class="note note-plain small" lang={l.bcp}><Icon name="globe" /> <span>{trr('sim.consoleNote')}</span></p>;
}

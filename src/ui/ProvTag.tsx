import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon';
import { tr } from '../lib/i18n';
import en from '../i18n/en';
import type { ProvOrDash } from '../lib/prov';

// A different shape for each label, and its name in words: the meaning never depends on colour.
const ICON: Record<ProvOrDash, IconName> = { live: 'target', replay: 'clock', sim: 'layers', hand: 'hand', unrecorded: 'info' };
const KEY: Record<ProvOrDash, string> = { live: 'prov.live', replay: 'prov.replay', sim: 'prov.sim', hand: 'prov.hand', unrecorded: 'prov.none' };

/** The label itself. `english` is for the officer console, which is English by design. */
export function ProvTag({ prov, who, english }: { prov: ProvOrDash; who?: string; english?: boolean }) {
  const text = (k: string) => (english ? (en[k] as string) : tr(k));
  const by = who ? ' ' + text('prov.by').split('{who}').join(who) : '';
  return (
    <span class={`tag tag-prov tag-prov-${prov}`} data-prov={prov} {...(prov === 'sim' ? { 'data-sim-label': '' } : {})}>
      <Icon name={ICON[prov]} size={14} /> <span>{text(KEY[prov])}{by}</span>
    </span>
  );
}

/** FIELD: evidence from a consented interview or a signed letter (src/data/fieldEvidence.ts). A display label only: it is
 *  not a packet origin, so it carries data-source and not data-prov. */
export function FieldTag({ english }: { english?: boolean }) {
  return (
    <span class="tag tag-prov tag-prov-field" data-source="field">
      <Icon name="user" size={14} /> <span>{english ? (en['prov.field'] as string) : tr('prov.field')}</span>
    </span>
  );
}

/** A value and its label together. `kind` says what the value is, so a test can find every value on a screen. */
export function Val({ kind, prov, who, english, children }: { kind: 'loc' | 'time' | 'photo' | 'reading' | 'reg' | 'note'; prov: ProvOrDash; who?: string; english?: boolean; children: ComponentChildren }) {
  return (
    <span class="val" data-v={kind} data-prov={prov}>
      {children} <ProvTag prov={prov} who={who} english={english} />
    </span>
  );
}

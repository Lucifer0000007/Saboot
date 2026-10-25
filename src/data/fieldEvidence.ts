// FIELD evidence: the real conversations behind Saboot, the single source for every field number the app shows and for
// docs/INTERVIEWS.md (scripts/interviews-doc.mjs writes it from this file). Anonymous: role, state or district, date.
// Rules: a detail that is not in the owner's verified list or in a raw note (docs/interviews/raw/) is "not recorded";
// a quote is only ever a word-for-word line from a raw note; a number a person gave is their own estimate.

export const NOT_RECORDED = 'not recorded';
export const NOT_CONFIRMED = 'not confirmed';

export interface SelfReported { text: string; note: 'self-reported estimate' }

export interface Interview {
  id: string;
  /** the plain role, counted for "roles": Patwari, Insurer loss assessor, Farmer, CSC operator */
  role: string;
  /** what else the owner recorded about the person; not counted */
  roleDetail?: string;
  state: string;
  district?: string;
  /** ISO date of the conversation */
  date: string;
  language: string;
  mode: string;
  consent: 'verbal, no objection raised';
  /** recording was not on the consent list: no audio or call recording exists or may be made */
  recording: 'not consented';
  /** PMFBY or a state scheme, when the person said which */
  scheme: string;
  /** short tags, drawn only from the raw note */
  themes: string[];
  selfReportedFigures: SelfReported[];
  /** word for word from the raw note, or empty */
  quote: string;
  /** the raw note's file name under docs/interviews/raw/ */
  source: string;
}

/** A letter of interest or a person using the app: recorded only once it exists. */
export interface FieldRecord { id: string; role: string; state: string; date: string; source: string }

const CONSENT = 'verbal, no objection raised' as const;
// No raw note is in docs/interviews/raw/ yet: themes, figures and quotes stay empty until one is, and each record says so.
const NO_RAW = `${NOT_RECORDED} (no raw note in docs/interviews/raw/ yet)`;
const base = { language: NOT_RECORDED, mode: 'phone call', consent: CONSENT, recording: 'not consented' as const, themes: [], selfReportedFigures: [], quote: '', source: NO_RAW };

export const INTERVIEWS: Interview[] = [
  { ...base, id: 'I-01', role: 'Patwari', roleDetail: 'lekhpal (called patwari locally), field assessor', state: 'Uttar Pradesh', district: 'Mirzapur', date: '2026-10-21', language: 'Hindi', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-02', role: 'Insurer loss assessor', roleDetail: 'private insurer, surveyor', state: 'Tamil Nadu', district: 'Thanjavur', date: '2026-10-21', language: 'Tamil (the conversation was held by a Tamil-speaking friend of the team)', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-03', role: 'Farmer', roleDetail: 'small landowner (ancestral land)', state: 'Bihar', district: 'Darbhanga', date: '2026-10-23', language: 'Hindi', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-04', role: 'Farmer', roleDetail: 'small landowner (ancestral land)', state: 'Bihar', district: 'Darbhanga', date: '2026-10-23', language: 'Hindi', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-05', role: 'Farmer', roleDetail: 'small landowner (ancestral land)', state: 'Bihar', district: 'Darbhanga', date: '2026-10-23', language: 'Hindi', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-06', role: 'Farmer', roleDetail: 'woman farmer, maize, KCC holder', state: 'Odisha', date: '2026-10-25', language: 'Hindi', scheme: NOT_CONFIRMED },
  { ...base, id: 'I-07', role: 'CSC operator', state: 'West Bengal', district: 'Kolkata', date: '2026-10-25', scheme: NOT_CONFIRMED },
];

export const LETTERS_OF_INTEREST: FieldRecord[] = [];
export const USERS: FieldRecord[] = [];

export interface FieldData { interviews: Interview[]; letters: FieldRecord[]; users: FieldRecord[] }
export const FIELD_DATA: FieldData = { interviews: INTERVIEWS, letters: LETTERS_OF_INTEREST, users: USERS };

/** The state the demo's crop-insurance rail uses (src/config.ts): where interviews are still to be done. */
export const TARGET_STATE = 'Haryana';

export interface FieldCounts { interviews: number; states: number; roles: number; inTargetState: number; letters: number; users: number }

/** Every field number on screen comes from here. */
export function fieldCounts({ interviews, letters, users }: FieldData = FIELD_DATA): FieldCounts {
  return {
    interviews: interviews.length,
    states: new Set(interviews.map((i) => i.state)).size,
    roles: new Set(interviews.map((i) => i.role)).size,
    inTargetState: interviews.filter((i) => i.state === TARGET_STATE).length,
    letters: letters.length,
    users: users.length,
  };
}

/** What the impact view shows, decided here so a test can check it without a browser: letters and users only above
 *  zero, a theme only with its state, a quote only when the raw note has one. */
export function fieldView(data: FieldData = FIELD_DATA) {
  const c = fieldCounts(data);
  const list = data.interviews;
  return {
    counts: c,
    showLetters: c.letters > 0,
    showUsers: c.users > 0,
    themes: list.flatMap((i) => i.themes.map((theme) => ({ id: i.id, state: i.state, theme }))),
    quotes: list.filter((i) => i.quote.trim() !== '').map((i) => ({ id: i.id, role: i.role, state: i.state, quote: i.quote })),
  };
}

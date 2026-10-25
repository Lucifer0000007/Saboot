// Write docs/INTERVIEWS.md from src/data/fieldEvidence.ts, the single source of the field evidence. Rerun after editing it:
//   node --import ./scripts/ts-resolve.mjs scripts/interviews-doc.mjs
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { INTERVIEWS, LETTERS_OF_INTEREST, USERS, TARGET_STATE, NOT_RECORDED, fieldCounts } from '../src/data/fieldEvidence.ts';

const c = fieldCounts();
const RAW = 'docs/interviews/raw';
const raw = existsSync(RAW) ? readdirSync(RAW).filter((f) => f !== 'README.md') : [];
const list = (xs, f) => (xs.length ? xs.map(f).join('\n') : `- ${NOT_RECORDED}`);
const out = [
  '# Interviews',
  '',
  '> Notes were grammar-edited with AI; originals are in docs/interviews/raw/.',
  '>',
  `> Generated from \`src/data/fieldEvidence.ts\` by \`scripts/interviews-doc.mjs\`: edit the data file, then rerun the script.`,
  '> Anonymous: role, state or district and date only. A quote appears only if it is word for word in a raw note; a number a',
  '> person gave is their own estimate. Anything not in the verified list or a raw note reads "not recorded".',
  ...(raw.length ? [] : ['>', `> **Status: no raw note is in ${RAW}/ yet**, so no theme, figure or quote is recorded below; each conversation`, '> shows only the verified role, place, date and consent.']),
  '',
  `${c.interviews} interviews · ${c.states} states · ${c.roles} roles · ${c.inTargetState} in ${TARGET_STATE} · ${c.letters} letters of interest · ${c.users} users.`,
  '',
  '## Conversations',
  '',
  ...INTERVIEWS.flatMap((i) => [
    `### ${i.id}: ${i.role}${i.roleDetail ? ` — ${i.roleDetail}` : ''}, ${i.district ? `${i.district}, ` : ''}${i.state}`,
    '',
    `- Date: ${i.date}`,
    `- District: ${i.district ?? NOT_RECORDED}`,
    `- Language: ${i.language}`,
    `- Mode (in person or phone): ${i.mode}`,
    `- Consent: ${i.consent}, anonymous`,
    `- Recording: ${i.recording} (recording was not on the consent list; no audio exists)`,
    `- Scheme (PMFBY or a state scheme): ${i.scheme}`,
    `- Source: ${i.source}`,
    '- Themes raised:',
    list(i.themes, (t) => `  - ${t}`).replace(/^- /m, '  - '),
    '- Figures they gave (self-reported estimates, not findings):',
    list(i.selfReportedFigures, (f) => `  - ${f.text} (${f.note})`).replace(/^- /m, '  - '),
    `- Quote: ${i.quote ? `"${i.quote}"` : NOT_RECORDED}`,
    '',
  ]),
  '## Not yet done',
  '',
  `- ${TARGET_STATE}: farmers and a patwari (${c.inTargetState} interviews so far).`,
  `- Letters of interest: ${LETTERS_OF_INTEREST.length ? LETTERS_OF_INTEREST.map((l) => l.role).join(', ') : 'none yet'}.`,
  `- People using the app: ${USERS.length ? USERS.length : 'none yet'}.`,
  '',
  'How to run and record a conversation: `docs/STAKEHOLDER-INTERVIEW-GUIDE.md`.',
  '',
];
writeFileSync('docs/INTERVIEWS.md', out.join('\n'));
console.log(`docs/INTERVIEWS.md: ${INTERVIEWS.length} interviews written`);

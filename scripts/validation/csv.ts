// A small CSV reader with no dependencies: quoted fields, doubled quotes, CRLF or LF, a leading byte-order mark, and
// comment lines that start with "#" (so a file can say where it came from). Empty lines are skipped.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const endField = () => { row.push(field); field = ''; };
  const endRow = () => {
    endField();
    if (row.length > 1 || row[0].trim() !== '') rows.push(row);
    row = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') endField();
    else if (c === '\n') endRow();
    else if (c === '\r') { if (src[i + 1] !== '\n') endRow(); }
    else field += c;
  }
  if (field !== '' || row.length) endRow();
  return rows.filter((r) => !r[0].trimStart().startsWith('#'));
}

export interface Table { header: string[]; rows: Record<string, string>[]; lines: number }

/** Header row plus records keyed by column name (trimmed). Rows shorter than the header leave the rest empty. */
export function readTable(text: string): Table {
  const all = parseCsv(text);
  if (!all.length) return { header: [], rows: [], lines: 0 };
  const header = all[0].map((h) => h.trim());
  const rows = all.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { header, rows, lines: all.length };
}

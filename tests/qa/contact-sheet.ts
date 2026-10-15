// Global teardown: aggregate qa/results/*.json into qa/summary.json and a contact sheet qa/index.html.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

interface R { group: string; id: string; shot: string; viewport?: string; lang?: string; layout?: string[]; axe?: string[]; console?: string[]; [k: string]: unknown }

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export default function contactSheet() {
  if (!existsSync('qa/results')) return;
  const rs: R[] = readdirSync('qa/results').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync('qa/results/' + f, 'utf8')));
  const problems = (r: R) => [...(r.layout ?? []), ...(r.axe ?? []), ...(r.console ?? []).map((c) => 'console: ' + c)];
  const groups = [...new Set(rs.map((r) => r.group))];
  const failed = rs.filter((r) => problems(r).length);
  writeFileSync('qa/summary.json', JSON.stringify({ total: rs.length, failed: failed.length, failures: failed.map((r) => ({ group: r.group, id: r.id, problems: problems(r) })) }, null, 1));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Saboot QA contact sheet</title>
<style>
:root{--p:#f6f3f1;--k:#242424;--g:#4e4d4d;--bad:#b3402a;--ok:#1f6b4a}
body{margin:0;padding:24px;background:var(--p);color:var(--k);font:14px/1.45 ui-monospace,Consolas,monospace}
h1{font:400 32px Georgia,serif;margin:0 0 4px}h2{font:400 22px Georgia,serif;margin:32px 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
figure{margin:0;border:1px solid #cecac8;border-radius:12px;padding:8px;background:#fff}
figure.bad{border:2px solid var(--bad)}img{width:100%;height:auto;display:block;border-radius:6px}
figcaption{margin-top:6px;font-size:12px}.p{color:var(--bad);font-size:11px;margin:4px 0 0;padding-left:16px}
.ok{color:var(--ok)}.badc{color:var(--bad)}
</style></head><body>
<h1>Saboot QA contact sheet</h1>
<p>${rs.length} captures · <span class="${failed.length ? 'badc' : 'ok'}">${failed.length} with problems</span> · generated ${new Date().toISOString()}</p>
${groups.map((g) => `<h2>${esc(g)}</h2><div class="grid">${rs.filter((r) => r.group === g).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true })).map((r) => {
    const p = problems(r);
    return `<figure class="${p.length ? 'bad' : ''}"><a href="${r.shot}"><img loading="lazy" src="${r.shot}" alt="${esc(g + ' ' + r.id)}"></a><figcaption>${esc(r.id)} ${p.length ? `<span class="badc">· ${p.length} problem(s)</span>` : '<span class="ok">· ok</span>'}</figcaption>${p.length ? `<ul class="p">${p.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</figure>`;
  }).join('')}</div>`).join('\n')}
</body></html>`;
  writeFileSync('qa/index.html', html);
  console.log(`\nQA contact sheet: qa/index.html (${rs.length} captures, ${failed.length} with problems)`);
}

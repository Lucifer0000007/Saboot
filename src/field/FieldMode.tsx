// Field mode (lazy chunk): the owner's minimal real-use path. One farmer at a time: their details (typed), their consent
// in their language, a clock started by hand, real photos, a seal, and the signed code to share. The officer side lists
// only codes received here. No replay clock, no simulated farmer, no simulated photo: every value is LIVE or HAND.
// Everything is kept on this phone (IndexedDB); nothing is sent unless the person shares the code. Saboot decides nothing.
import '../styles/field.css';
import { signal } from '@preact/signals';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from '../ui/Icon';
import { ProvTag, Val } from '../ui/ProvTag';
import { tr, trIn, prefetchLang, LANGS, langReady } from '../lib/i18n';
import { announce, showToast } from '../lib/announce';
import { dbGet, dbSet } from '../lib/db';
import { sha256 } from '../lib/hash';
import { getGeo, watchGeo } from '../farmer/focus';
import { normalizePhoto, SHOTS, type ShotKind } from '../farmer/photo';
import { Viewfinder } from '../farmer/screens/Capture';
import { makeCode, newDeviceKey, qrTextOf, verifyCode, codeFromQrText, type KPayload } from '../k/payload';
import { codeOf } from '../k/bundle';
import { qrPath } from '../k/qr';
import { scanQr } from '../k/scan';
import type { Lang } from '../sim/types';
import { leaveField } from './on';

interface FShot { kind: ShotKind; sha: string; at: number; geo: { lat: number; lon: number; acc: number } | null }
interface FRec {
  /** F-1, F-2 …: field records never use the simulation's plot ids. The number is what the code carries. */
  id: string;
  name: string; village: string; khasra: string; crop: string; lang: Lang; by: string;
  consent?: { at: number; lang: Lang; text: string };
  clockAt?: number;
  shots: FShot[];
  seal?: { at: number; code: string };
}
interface Got { code: string; payload: KPayload; at: number }

const REC_KEY = 'field-records', GOT_KEY = 'field-received';
const recs = signal<FRec[]>([]);
const got = signal<Got[]>([]);
const loaded = signal(false);
async function load() {
  if (loaded.value) return;
  recs.value = (await dbGet<FRec[]>('kv', REC_KEY)) ?? [];
  got.value = (await dbGet<Got[]>('kv', GOT_KEY)) ?? [];
  loaded.value = true;
}
async function put(r: FRec) {
  recs.value = recs.value.some((x) => x.id === r.id) ? recs.value.map((x) => (x.id === r.id ? r : x)) : [...recs.value, r];
  await dbSet('kv', REC_KEY, recs.value);
}
const photoKey = (id: string, kind: ShotKind) => `field:${id}:${kind}`;
const num = (id: string) => parseInt(id.replace(/\D/g, ''), 10);

async function deviceKey(): Promise<CryptoKeyPair> {
  const k = await dbGet<CryptoKeyPair>('kv', 'k-device-key');
  if (k) return k;
  const fresh = await newDeviceKey();
  await dbSet('kv', 'k-device-key', fresh);
  return fresh;
}

const bcp = () => LANGS.find((l) => l.id === langReady.value)?.bcp ?? 'en';
const when = (ms: number) => new Date(ms).toLocaleString(bcp(), { dateStyle: 'medium', timeStyle: 'short' });
/** Hours from the hand-started clock; the code counts every time from it. */
const hrs = (ms: number, from: number) => Math.round(((ms - from) / 3.6e6) * 100) / 100;

function Strip() {
  return (
    <div class="fd-strip" role="note" data-field-strip>
      <p><Icon name="lock" /> <span>{tr('fd.strip')}</span></p>
      <button type="button" class="pill pill-sm pill-ghost" data-leave-field onClick={leaveField}>{tr('fd.leave')}</button>
    </div>
  );
}

function NewFarmer({ onDone }: { onDone: (r: FRec) => void }) {
  const [f, setF] = useState({ name: '', village: '', khasra: '', crop: '', by: '', lang: langReady.value as Lang });
  const [err, setErr] = useState(false);
  const ids = recs.value.map((r) => num(r.id));
  const n = (ids.length ? Math.max(...ids) : 0) + 1;
  const field = (k: 'name' | 'village' | 'khasra' | 'crop' | 'by', label: string) => (
    <label class="field">
      <span>{label}</span>
      <input class="input" value={f[k]} data-fd={k} onInput={(e) => setF({ ...f, [k]: (e.currentTarget as HTMLInputElement).value })} />
    </label>
  );
  async function save(e: Event) {
    e.preventDefault();
    const v = { ...f, name: f.name.trim(), village: f.village.trim(), khasra: f.khasra.trim(), crop: f.crop.trim(), by: f.by.trim() };
    if (!v.name || !v.village || !v.khasra || !v.crop || !v.by || n > 255) return setErr(true);
    const r: FRec = { id: 'F-' + n, ...v, shots: [] };
    await put(r);
    void prefetchLang(r.lang);
    onDone(r);
  }
  return (
    <form class="card stack" onSubmit={save} data-field-new>
      <h3>{tr('fd.new')} <span class="nb">F-{n}</span></h3>
      {field('name', tr('fd.name'))}
      {field('village', tr('fd.village'))}
      {field('khasra', tr('fd.khasra'))}
      {field('crop', tr('fd.crop'))}
      <label class="field">
        <span>{tr('fd.lang')}</span>
        <select class="input" value={f.lang} data-fd="lang" onChange={(e) => setF({ ...f, lang: (e.currentTarget as HTMLSelectElement).value as Lang })}>
          {LANGS.map((l) => <option key={l.id} value={l.id} lang={l.bcp}>{l.label}</option>)}
        </select>
      </label>
      {field('by', tr('fd.by'))}
      {err && <p class="note note-warn" role="alert"><Icon name="info" /><span>{tr('fd.need')}</span></p>}
      <button type="submit" class="pill pill-dark"><Icon name="check" /> {tr('fd.save')}</button>
    </form>
  );
}

function Thumb({ id, kind }: { id: string; kind: ShotKind }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null;
    void dbGet<Blob>('photos', photoKey(id, kind)).then((b) => { if (b) setUrl((u = URL.createObjectURL(b))); });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id, kind]);
  return url ? <img class="thumb" src={url} alt={tr('shot.' + kind)} width="96" height="72" /> : <div class="thumb thumb-ph" aria-hidden="true" />;
}

function Loc({ geo }: { geo: FShot['geo'] }) {
  return geo ? <Val kind="loc" prov="live">{tr('fd.gps', { m: Math.round(geo.acc) })}</Val> : <span class="val" data-v="loc" data-no-loc>{tr('fd.noLoc')}</span>;
}

function Share({ code }: { code: string }) {
  const [boxed, setBoxed] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const link = `${location.origin}${location.pathname}?mode=field#k=${code}`;
  const qr = useMemo(() => qrPath(qrTextOf(code), { ecc: 'L', border: 4 }), [code]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(tr('fd.copied'), 'ok');
    } catch {
      // the fallback: the code in a box, selected, for a copy by hand
      setBoxed(true);
      showToast(tr('fd.copyFail'), 'warn');
      requestAnimationFrame(() => box.current?.select());
    }
  };
  return (
    <section class="card stack" data-field-share>
      <h3>{tr('fd.share')}</h3>
      <p>{tr('fd.shareLead')}</p>
      <svg class="qr" width="280" height="280" viewBox={`0 0 ${qr.size} ${qr.size}`} role="img" aria-label={tr('fd.qr')} shape-rendering="crispEdges">
        <rect width={qr.size} height={qr.size} fill="#ffffff" />
        <path d={qr.d} fill="#000000" />
      </svg>
      <div class="row">
        <button type="button" class="pill pill-ghost" data-copy-code onClick={() => copy(code)}><Icon name="copy" /> {tr('fd.copyCode')}</button>
        <button type="button" class="pill pill-ghost" data-copy-link onClick={() => copy(link)}><Icon name="link" /> {tr('fd.copyLink')}</button>
      </div>
      <label class="field">
        <span>{tr('fd.codeBox')}</span>
        <textarea ref={box} class={'input k-text' + (boxed ? ' fd-boxed' : '')} rows={4} readOnly spellcheck={false} data-field-code value={code} onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()} />
      </label>
    </section>
  );
}

function Record({ r, onBack }: { r: FRec; onBack: () => void }) {
  const [cam, setCam] = useState<ShotKind | null>(null);
  const [camFail, setCamFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const fileKind = useRef<ShotKind>('wide');
  useEffect(() => { void prefetchLang(r.lang); }, [r.lang]);
  useEffect(() => (r.consent && !r.seal ? watchGeo() : undefined), [!!r.consent, !!r.seal]);
  const consentText = trIn(r.lang, 'as.consentText', { farmer: r.name, helper: r.by });
  const ready = !!r.consent && r.clockAt !== undefined && r.shots.length > 0;

  async function agree() {
    await put({ ...r, consent: { at: Date.now(), lang: r.lang, text: consentText } });
    announce(tr('fd.consented', { time: when(Date.now()) }));
  }
  async function startClock() {
    await put({ ...r, clockAt: Date.now() });
  }
  async function take(kind: ShotKind, blob: Blob) {
    setCam(null);
    setBusy(true);
    setMsg(null);
    try {
      const n = await normalizePhoto(blob);
      const sha = await sha256(n.blob);
      const g = await getGeo();
      await dbSet('photos', photoKey(r.id, kind), n.blob);
      const shot: FShot = { kind, sha, at: Date.now(), geo: g ? { lat: g.lat, lon: g.lon, acc: g.acc } : null };
      const cur = recs.value.find((x) => x.id === r.id) ?? r;
      await put({ ...cur, shots: [...cur.shots.filter((s) => s.kind !== kind), shot] });
      announce(tr('cap.taken') + ': ' + tr('shot.' + kind));
    } catch {
      setMsg(tr('fd.saveFail'));
    } finally {
      setBusy(false);
    }
  }
  async function seal() {
    setMsg(null);
    setBusy(true);
    try {
      const now = Date.now(), from = r.clockAt!;
      const g = r.shots.find((s) => s.geo)?.geo;
      const shots = SHOTS.flatMap((k) => r.shots.filter((s) => s.kind === k));
      const code = await makeCode({
        plot: r.id, eventT: 0, sealT: hrs(now, from), deviceMs: now, lat: g?.lat ?? 0, lon: g?.lon ?? 0,
        shots: shots.map((s) => ({ kind: s.kind, simT: hrs(s.at, from), sha: s.sha, photo: 'live' as const, loc: s.geo ? ('live' as const) : undefined })),
      }, await deviceKey());
      await put({ ...r, seal: { at: now, code } });
      announce(tr('fd.sealed', { time: when(now) }));
    } catch {
      setMsg(tr('fd.sealFail'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="stack" data-field-record={r.id}>
      <button type="button" class="link-arrow fd-back" onClick={onBack}><Icon name="left" size={16} /> {tr('fd.records')}</button>
      <section class="card stack">
        <h3>{r.name} <span class="nb">{r.id}</span></h3>
        <p>{r.village} · {tr('fd.khasra')}: {r.khasra} · {r.crop}</p>
        <p class="f-help">{tr('fd.byShort', { who: r.by })} <ProvTag prov="hand" /></p>
      </section>

      <section class="card stack" data-field-consent>
        <h3>1. {tr('fd.consentTitle', { farmer: r.name })}</h3>
        <blockquote lang={LANGS.find((l) => l.id === r.lang)?.bcp} class="fd-consent">{r.consent?.text ?? consentText}</blockquote>
        {r.consent ? (
          <p class="note note-ok"><Icon name="check" /><span>{tr('fd.consented', { time: when(r.consent.at) })}</span> <ProvTag prov="live" /></p>
        ) : (
          <>
            <p class="f-help">{tr('fd.consentIntro', { farmer: r.name })}</p>
            <button type="button" class="pill pill-dark" data-field-agree onClick={agree}><Icon name="hand" /> {tr('fd.agree', { farmer: r.name })}</button>
          </>
        )}
      </section>

      {r.consent && (
        <section class="card stack" data-field-clock>
          <h3>2. {tr('fd.clock')}</h3>
          {r.clockAt !== undefined ? (
            <p><Val kind="time" prov="hand">{tr('fd.clockAt', { time: when(r.clockAt) })}</Val></p>
          ) : (
            <>
              <p class="f-help">{tr('fd.clockHelp')}</p>
              <button type="button" class="pill pill-dark" data-field-clock-start onClick={startClock}><Icon name="clock" /> {tr('fd.clock')}</button>
            </>
          )}
        </section>
      )}

      {r.consent && r.clockAt !== undefined && (
        <section class="card stack" data-field-photos>
          <h3>3. {tr('fd.photos')}</h3>
          <ul class="fd-shots" role="list">
            {SHOTS.map((k) => {
              const s = r.shots.find((x) => x.kind === k);
              return (
                <li key={k} class="fd-shot" data-field-shot={k}>
                  {s ? <Thumb id={r.id} kind={k} /> : <div class="thumb thumb-ph" aria-hidden="true"><Icon name="image" /></div>}
                  <div class="stack">
                    <strong>{tr('shot.' + k)}</strong>
                    {s ? (
                      <>
                        <Val kind="photo" prov="live">{tr('fd.photoAt', { time: when(s.at) })}</Val>
                        <Loc geo={s.geo} />
                      </>
                    ) : !r.seal && (
                      <div class="row">
                        <button type="button" class="pill pill-sm pill-dark" disabled={busy} data-field-take={k} onClick={() => { setCamFail(false); setCam(k); }}><Icon name="camera" size={16} /> {tr('fd.take')}</button>
                        <button type="button" class="pill pill-sm pill-ghost" disabled={busy} onClick={() => { fileKind.current = k; file.current?.click(); }}><Icon name="image" size={16} /> {tr('fd.file')}</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {camFail && <p class="note note-warn" role="alert"><Icon name="info" /><span>{tr('fd.noCam')}</span></p>}
          {busy && <p class="working" role="status"><span class="spin" aria-hidden="true" /> {tr('fd.saving')}</p>}
          <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = (e.currentTarget as HTMLInputElement).files?.[0]; (e.currentTarget as HTMLInputElement).value = ''; if (f) void take(fileKind.current, f); }} />
        </section>
      )}

      {r.consent && r.clockAt !== undefined && (
        <section class="card stack" data-field-seal>
          <h3>4. {tr('fd.seal', { farmer: r.name })}</h3>
          {r.seal ? (
            <p class="note note-ok"><Icon name="lock" /><span>{tr('fd.sealed', { time: when(r.seal.at) })}</span> <ProvTag prov="live" /></p>
          ) : (
            <>
              {!ready && <p class="f-help">{tr('fd.sealNeed')}</p>}
              <button type="button" class="pill pill-dark" disabled={!ready || busy} data-field-seal-btn onClick={seal}><Icon name="lock" /> {tr('fd.seal', { farmer: r.name })}</button>
            </>
          )}
        </section>
      )}
      {msg && <p class="note note-bad" role="alert"><Icon name="alert" /><span>{msg}</span></p>}
      {r.seal && <Share code={r.seal.code} />}
      {cam && <Viewfinder onShot={(b) => void take(cam, b)} onFail={() => { setCam(null); setCamFail(true); }} onClose={() => setCam(null)} />}
    </div>
  );
}

function Capture() {
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const r = recs.value.find((x) => x.id === open);
  if (r) return <Record r={r} onBack={() => setOpen(null)} />;
  if (adding || !recs.value.length) return <NewFarmer onDone={(x) => { setAdding(false); setOpen(x.id); }} />;
  return (
    <section class="stack" data-field-list>
      <h3>{tr('fd.records')}</h3>
      <ul class="stack" role="list">
        {recs.value.map((x) => (
          <li key={x.id}>
            <button type="button" class="card fd-row" onClick={() => setOpen(x.id)}>
              <strong>{x.name}</strong> <span class="nb">{x.id}</span> · {x.village} · {x.seal ? tr('fd.isSealed') : tr('fd.notSealed')}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" class="pill pill-dark" data-field-add onClick={() => setAdding(true)}><Icon name="user" /> {tr('fd.new')}</button>
    </section>
  );
}

/** Check a code here, on this phone, and keep it when it is whole and holds only real photos. */
async function receive(text: string): Promise<'ok' | 'dup' | 'bad' | 'sim' | 'crypto'> {
  const code = codeOf(codeFromQrText(text));
  let res: Awaited<ReturnType<typeof verifyCode>>;
  try { res = await verifyCode(code); } catch { return 'crypto'; }
  if (!res.ok || !res.payload) return 'bad';
  const p = res.payload;
  if (p.shots.some((s) => s.photo !== 'live')) return 'sim';
  if (got.value.some((g) => g.payload.head === p.head)) return 'dup';
  got.value = [...got.value, { code, payload: p, at: Date.now() }];
  await dbSet('kv', GOT_KEY, got.value);
  return 'ok';
}

function Item({ g }: { g: Got }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { verifyCode(g.code).then((r) => setOk(r.ok), () => setOk(false)); }, [g.code]);
  const p = g.payload;
  const hasLoc = p.shots.some((s) => s.loc === 'live');
  return (
    <li class="card stack" data-received={'F-' + num(p.plot)}>
      <p><strong>F-{num(p.plot)}</strong> · {tr('fd.recv.photos', { n: p.shots.length })}</p>
      {ok === null ? <p class="working" role="status"><span class="spin" aria-hidden="true" /></p> : ok ? (
        <p class="note note-ok" data-seal-ok><Icon name="okShape" /><span><strong>{tr('fd.recv.ok')}</strong></span></p>
      ) : (
        <p class="note note-bad"><Icon name="barShape" /><span>{tr('fd.recv.bad')}</span></p>
      )}
      <p><Val kind="time" prov="live">{tr('fd.recv.at', { time: when(g.at) })}</Val></p>
      <p><Val kind="time" prov="live">{tr('fd.recv.sealAt', { time: when(p.deviceMs) })}</Val></p>
      <p><Val kind="time" prov="hand">{tr('fd.recv.clock')}</Val></p>
      <ul class="stack" role="list">
        {p.shots.map((s) => (
          <li key={s.kind}>
            {tr('shot.' + s.kind)}: <Val kind="photo" prov="live">{tr('fd.recv.after', { h: s.simT.toFixed(2) })}</Val>
            {s.loc === 'live' ? '' : <> · <span class="val" data-v="loc" data-no-loc>{tr('fd.noLoc')}</span></>}
          </li>
        ))}
      </ul>
      {hasLoc && <p><Val kind="loc" prov="live">{p.lat.toFixed(3)}, {p.lon.toFixed(3)}</Val></p>}
      <p class="f-help">{tr('fd.recv.noProof')}</p>
    </li>
  );
}

const GOT = { ok: 'fd.got.ok', dup: 'fd.got.dup', bad: 'fd.got.bad', sim: 'fd.got.sim', crypto: 'fd.got.crypto' } as const;

function Officer() {
  const [text, setText] = useState('');
  const [say, setSay] = useState<string | null>(null);
  const [scan, setScan] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const run = async (t: string) => {
    const r = await receive(t);
    const m = tr(GOT[r]);
    setSay(m);
    announce(m);
    if (r === 'ok') setText('');
  };
  useEffect(() => {
    // a link opened with #k= in field mode is checked straight away
    const k = /#k=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1];
    if (k) { void run(k); history.replaceState(history.state, '', location.pathname + location.search); }
  }, []);
  useEffect(() => {
    if (!scan || !video.current) return;
    return scanQr(video.current, (c) => { setScan(false); void run(c); }, () => { setScan(false); setSay(tr('fd.noCam')); });
  }, [scan]);
  return (
    <div class="stack" data-field-officer>
      <p>{tr('fd.recv.lead')}</p>
      <form class="card stack" onSubmit={(e) => { e.preventDefault(); void run(text); }}>
        <label class="field">
          <span>{tr('fd.recv.paste')}</span>
          <textarea class="input k-text" rows={4} value={text} spellcheck={false} data-field-paste onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
        </label>
        <div class="row">
          <button type="submit" class="pill pill-dark" disabled={!text.trim()} data-field-check><Icon name="shield" /> {tr('fd.recv.check')}</button>
          <button type="button" class="pill pill-ghost" onClick={() => setScan(!scan)}><Icon name="scan" size={16} /> {scan ? tr('fd.recv.stopScan') : tr('fd.recv.scan')}</button>
        </div>
        {scan && <div class="k-scan"><video ref={video} muted playsInline aria-label={tr('fd.recv.scan')} /></div>}
        {say && <p class="note note-plain" role="status" data-field-say><Icon name="info" /><span>{say}</span></p>}
      </form>
      <h3>{tr('fd.tabOfficer')}</h3>
      {got.value.length === 0 ? <p class="muted">{tr('fd.recv.none')}</p> : (
        <ul class="stack" role="list">{[...got.value].reverse().map((g) => <Item key={g.payload.head} g={g} />)}</ul>
      )}
    </div>
  );
}

export default function FieldMode() {
  const [tab, setTab] = useState<'capture' | 'officer'>(/#k=/.test(location.hash) ? 'officer' : 'capture');
  useEffect(() => { void load(); }, []);
  return (
    <section class="sec fd" aria-labelledby="fd-h" data-field-mode>
      <div class="wrap stack">
        <Strip />
        <h2 id="fd-h">{tr('fd.title')}</h2>
        <p class="note note-plain"><Icon name="shield" /><span>{tr('fd.stay')}</span></p>
        <div class="seg" role="radiogroup" aria-label={tr('fd.title')}>
          <button type="button" role="radio" aria-checked={tab === 'capture'} data-field-tab="capture" onClick={() => setTab('capture')}><Icon name="camera" size={16} /> {tr('fd.tabFarmer')}</button>
          <button type="button" role="radio" aria-checked={tab === 'officer'} data-field-tab="officer" onClick={() => setTab('officer')}><Icon name="inbox" size={16} /> {tr('fd.tabOfficer')}</button>
        </div>
        {!loaded.value ? <p class="working" role="status"><span class="spin" aria-hidden="true" /></p> : tab === 'capture' ? <Capture /> : <Officer />}
      </div>
    </section>
  );
}

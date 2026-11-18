// The /sql/ page: SQL on the almanac's SQLite database, in the reader's own browser.
//
// Nothing heavy loads with the page. The first run starts a worker that loads sql.js (SQLite compiled to
// WebAssembly) from jsDelivr, while the page fetches the gzipped database from this site and unzips it. Queries
// run in the worker, so a slow one never freezes the page, and Stop ends it by closing the worker. The page keeps
// the unzipped bytes, so the next run opens a fresh copy without downloading again.
import { CREDIT_LINE } from '../lib/db-schema.ts';
import { columnDecimals, showNumber } from '../lib/sql-format.ts';

const SQLJS = '1.12.0';
const CDN = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS}/dist/`;
/** Rows the table draws. The CSV and Markdown copies hold every row. */
const SHOWN = 500;
/** Rows a Markdown copy holds, so a paste stays readable. */
const MD_ROWS = 1000;

type Value = string | number | null | Uint8Array;
interface Result {
  columns: string[];
  values: Value[][];
}

const workerCode = `
importScripts('${CDN}sql-wasm.js');
let db = null;
const ready = initSqlJs({ locateFile: (f) => '${CDN}' + f });
onmessage = async (e) => {
  const m = e.data;
  try {
    const SQL = await ready;
    if (m.type === 'open') {
      db = new SQL.Database(new Uint8Array(m.buf));
      postMessage({ type: 'opened' });
    } else if (m.type === 'exec') {
      const t0 = performance.now();
      const res = db.exec(m.sql);
      postMessage({ type: 'result', id: m.id, res: res.length ? res[res.length - 1] : null, statements: res.length, ms: performance.now() - t0 });
    }
  } catch (err) {
    postMessage({ type: 'error', id: m.id, message: String((err && err.message) || err) });
  }
};
`;

const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`;
const plural = (k: number, one: string, many = `${one}s`) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;

export function wireSql() {
  const root = document.querySelector<HTMLElement>('[data-sq]');
  if (!root) return;
  const q = root.querySelector<HTMLTextAreaElement>('[data-q]')!;
  const runBtn = root.querySelector<HTMLButtonElement>('[data-run]')!;
  const stopBtn = root.querySelector<HTMLButtonElement>('[data-stop]')!;
  const status = root.querySelector<HTMLElement>('[data-status]')!;
  const meta = root.querySelector<HTMLElement>('[data-meta]')!;
  const table = root.querySelector<HTMLTableElement>('[data-table]')!;
  const exButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-ex]')];
  const examples = JSON.parse(root.dataset.examples ?? '[]') as { id: string; sql: string }[];
  const dbUrl = root.dataset.db!;
  const size = root.dataset.size ?? '';

  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  root.querySelector('[data-key]')!.textContent = mac ? '⌘ Enter' : 'Ctrl Enter';

  // the server drew the first example's results, so the copies start from that table
  let current: Result | null = {
    columns: [...table.querySelectorAll('thead th')].map((th) => th.textContent ?? ''),
    values: [...table.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => {
        const t = td.textContent ?? '';
        return td.classList.contains('r') && t !== '' && !Number.isNaN(Number(t)) ? Number(t) : t;
      }),
    ),
  };
  let exampleId: string | null = examples[0]?.id ?? null;

  const say = (text: string, error = false) => {
    status.textContent = text;
    status.classList.toggle('err', error);
  };

  // ---- loading ---------------------------------------------------------------------------------------
  let bytes: Uint8Array | null = null;
  let worker: Worker | null = null;
  let opened: Promise<void> | null = null;
  let seq = 0;
  const waiting = new Map<number, { ok: (m: any) => void; fail: (e: Error) => void }>();

  async function fetchDb(): Promise<Uint8Array> {
    if (bytes) return bytes;
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser can’t unzip the database. Download it below and open it with any SQLite tool.');
    const res = await fetch(dbUrl);
    if (!res.ok || !res.body) throw new Error(`The database didn’t load (HTTP ${res.status}).`);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
      // a server may unzip on the way, and then the count passes the zipped length it announced
      say(total && got <= total ? `Loading the database: ${mb(got)} of ${mb(total)}.` : `Loading the database: ${mb(got)}.`);
    }
    const gz = new Uint8Array(got);
    let at = 0;
    for (const p of parts) {
      gz.set(p, at);
      at += p.length;
    }
    // a server that unzipped the file on the way leaves plain SQLite, which starts "SQLite format 3"
    const zipped = gz[0] === 0x1f && gz[1] === 0x8b;
    bytes = zipped ? new Uint8Array(await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()) : gz;
    return bytes;
  }

  function open(): Promise<void> {
    if (opened) return opened;
    opened = (async () => {
      say(`Loading SQLite and the database (${size}).`);
      const url = URL.createObjectURL(new Blob([workerCode], { type: 'text/javascript' }));
      const w = new Worker(url);
      URL.revokeObjectURL(url);
      worker = w;
      const ready = new Promise<void>((ok, fail) => {
        w.onmessage = (e) => {
          const m = e.data;
          if (m.type === 'opened') return ok();
          const p = waiting.get(m.id);
          if (!p) return m.type === 'error' && fail(new Error(m.message));
          waiting.delete(m.id);
          if (m.type === 'error') p.fail(Object.assign(new Error(m.message), { name: 'SqlError' }));
          else p.ok(m);
        };
        w.onerror = (e) => fail(new Error(e.message || 'SQLite didn’t load. Check your connection and run again.'));
      });
      const data = await fetchDb();
      say('Opening the database.');
      // hand over a copy, so a stopped worker can be replaced without downloading again
      const copy = data.slice();
      w.postMessage({ type: 'open', buf: copy.buffer }, [copy.buffer]);
      await ready;
    })();
    opened.catch(() => {
      worker?.terminate();
      worker = null;
      opened = null;
    });
    return opened;
  }

  function exec(sql: string): Promise<{ res: Result | null; statements: number; ms: number }> {
    const id = ++seq;
    return new Promise((ok, fail) => {
      waiting.set(id, { ok, fail });
      worker!.postMessage({ type: 'exec', id, sql });
    });
  }

  // ---- drawing ---------------------------------------------------------------------------------------
  const show = (v: Value): string => {
    if (v === null) return 'null';
    if (v instanceof Uint8Array) return `[${v.length} bytes]`;
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
    return v;
  };

  function draw(r: Result | null) {
    const head = table.tHead!.rows[0];
    const body = table.tBodies[0];
    if (!r) {
      head.replaceChildren();
      body.replaceChildren();
      return;
    }
    const numeric = r.columns.map((_, i) => r.values.every((row) => row[i] === null || typeof row[i] === 'number'));
    head.replaceChildren(
      ...r.columns.map((c, i) => {
        const th = document.createElement('th');
        th.textContent = c;
        if (numeric[i]) th.className = 'r';
        return th;
      }),
    );
    const shown = r.values.slice(0, SHOWN);
    const decimals = r.columns.map((_, i) => (numeric[i] ? columnDecimals(shown.map((row) => row[i])) : 0));
    const frag = document.createDocumentFragment();
    for (const row of shown) {
      const tr = document.createElement('tr');
      row.forEach((v, i) => {
        const td = document.createElement('td');
        td.textContent = numeric[i] && typeof v === 'number' ? showNumber(v, decimals[i]) : show(v);
        td.className = [numeric[i] ? 'r num' : '', v === null ? 'null' : ''].filter(Boolean).join(' ');
        tr.append(td);
      });
      frag.append(tr);
    }
    body.replaceChildren(frag);
  }

  // ---- running ---------------------------------------------------------------------------------------
  let running = false;
  async function run() {
    const sql = q.value.trim();
    if (!sql) return say('Write a query first.', true);
    if (running) return;
    running = true;
    runBtn.disabled = true;
    stopBtn.hidden = false;
    try {
      await open();
      say('Running.');
      const { res, statements, ms } = await exec(sql);
      current = res;
      draw(res);
      const rows = res?.values.length ?? 0;
      const time = ms < 1 ? 'under 1 ms' : `${Math.round(ms).toLocaleString('en-US')} ms`;
      meta.textContent = res ? (rows > SHOWN ? `${plural(rows, 'row')}. The table shows the first ${SHOWN}, and the CSV holds them all.` : plural(rows, 'row')) : 'No rows';
      say(res ? `Ran in ${time}.${statements > 1 ? ` The query had ${statements} statements that return rows, and this is the last one.` : ''}` : `Ran in ${time}. The query returned no rows.`);
    } catch (e) {
      const err = e as Error;
      if (err.name === 'Stop') say(err.message);
      else say(err.name === 'SqlError' ? `SQLite says: ${err.message}` : err.message, true);
    } finally {
      running = false;
      runBtn.disabled = false;
      stopBtn.hidden = true;
    }
  }

  function stop() {
    worker?.terminate();
    worker = null;
    opened = null;
    for (const p of waiting.values()) p.fail(Object.assign(new Error('Stopped. The next run opens a fresh copy of the database.'), { name: 'Stop' }));
    waiting.clear();
  }

  runBtn.addEventListener('click', run);
  stopBtn.addEventListener('click', stop);
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      run();
    }
  });
  // the editor grows with the query, from 6 to 24 lines, and scrolls past that
  const fit = () => (q.rows = Math.min(24, Math.max(6, q.value.split('\n').length + 1)));
  q.addEventListener('input', () => {
    fit();
    exampleId = null;
    for (const b of exButtons) b.setAttribute('aria-pressed', 'false');
  });
  for (const b of exButtons) {
    b.addEventListener('click', () => {
      const ex = examples.find((x) => x.id === b.dataset.ex);
      if (!ex) return;
      q.value = ex.sql;
      fit();
      exampleId = ex.id;
      for (const x of exButtons) x.setAttribute('aria-pressed', String(x === b));
      run();
    });
  }

  // ---- copies ----------------------------------------------------------------------------------------
  const today = () => new Date().toISOString().slice(0, 10);
  const csvField = (v: Value) => {
    const s = v === null ? '' : v instanceof Uint8Array ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      say(done);
    } catch {
      say('Your browser blocked the copy. Select the text and copy it yourself.', true);
    }
  }

  root.querySelector('[data-csv]')!.addEventListener('click', () => {
    if (!current) return say('Run a query that returns rows first.', true);
    const lines = [current.columns.map(csvField).join(','), ...current.values.map((r) => r.map(csvField).join(','))];
    const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `benchmark-almanac-${exampleId ?? 'query'}-${today()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say(`Saved ${plural(current.values.length, 'row')} as CSV. ${CREDIT_LINE}`);
  });

  root.querySelector('[data-md]')!.addEventListener('click', () => {
    if (!current) return say('Run a query that returns rows first.', true);
    const r = current;
    const numeric = r.columns.map((_, i) => r.values.every((row) => row[i] === null || typeof row[i] === 'number'));
    const esc = (v: Value) => show(v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const rows = r.values.slice(0, MD_ROWS);
    const md = [
      `| ${r.columns.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |`,
      `| ${numeric.map((x) => (x ? '---:' : '---')).join(' | ')} |`,
      ...rows.map((row) => `| ${row.map(esc).join(' | ')} |`),
      '',
      r.values.length > MD_ROWS ? `First ${MD_ROWS} of ${r.values.length} rows. ${CREDIT_LINE}` : CREDIT_LINE,
    ].join('\n');
    copy(md, `Copied ${plural(rows.length, 'row')} as Markdown, with the credit line under the table.`);
  });

  root.querySelector('[data-link]')!.addEventListener('click', () => {
    const url = new URL(location.href);
    url.search = '';
    url.hash = '';
    const ex = examples.find((x) => x.id === exampleId);
    if (ex && ex.sql === q.value) url.searchParams.set('ex', ex.id);
    else url.searchParams.set('q', q.value);
    copy(url.toString(), 'Copied a link that opens this query.');
  });

  document.querySelector('[data-copy-cite]')?.addEventListener('click', () => {
    const t = document.querySelector('[data-cite-text]')?.textContent ?? '';
    copy(t, 'Copied the citation.');
  });

  // ---- a link to a query ---------------------------------------------------------------------------------
  const params = new URLSearchParams(location.search);
  const fromLink = params.get('q') ?? examples.find((x) => x.id === params.get('ex'))?.sql;
  if (fromLink) {
    q.value = fromLink;
    fit();
    exampleId = params.get('ex') && !params.get('q') ? params.get('ex') : null;
    for (const b of exButtons) b.setAttribute('aria-pressed', String(b.dataset.ex === exampleId));
    run();
  }
}

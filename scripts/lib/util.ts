// Helpers shared by the data scripts. No dependencies: Node 22.18+ runs these files directly.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const dataPath = (...p: string[]) => join(ROOT, 'data', ...p);

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Loose match key: "SWE-bench Verified" and "SWE Bench verified" meet; versions stay apart. */
export function key(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/τ/g, 'tau')
    .replace(/²/g, '2')
    .replace(/’/g, "'")
    .replace(/(\d)\.0\b/g, '$1')
    .replace(/\b(benchmark|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function slug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/τ/g, 'tau')
    .replace(/²/g, '2')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/['’$]/g, '')
    .replace(/(\d)\.(\d)/g, '$1-$2')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

export async function fetchText(url: string, init: RequestInit = {}, tries = 3): Promise<string> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)', ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`${res.status} ${url}`);
      if (!res.ok) throw Object.assign(new Error(`${res.status} ${url}`), { fatal: true });
      return await res.text();
    } catch (e) {
      last = e;
      if ((e as { fatal?: boolean }).fatal) break;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw last;
}

export const fetchJson = async <T>(url: string, init: RequestInit = {}) => JSON.parse(await fetchText(url, init)) as T;

export const today = () => new Date().toISOString().slice(0, 10);

export function daysAgo(n: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function githubHeaders(): Record<string, string> {
  const t = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return { accept: 'application/vnd.github+json', ...(t ? { authorization: `Bearer ${t}` } : {}) };
}

// SuperCLUE general board (CLUE team) on superclueai.com. The site is a Vue app whose boards are Excel files
// under /data/: the general board for a round is /data/generalboard/<round>.xlsx (for example "2026年7月"),
// and the page's GeneralBoardPage chunk names the round it opens on (selectedDate). The score is 总分 (total
// score, 0 to 100) on the 总排行榜 (overall) sheet of that round. Each round uses new questions and SuperCLUE
// says scores from different rounds do not compare, so only the current round is read. The sheet's 发布日期
// (publication date of the row) is passed as the run date. The file is read with a small zip and XLSX reader
// below (no dependencies), which superclue-agent.ts and superclue-rag.ts share.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';
import { inflateRawSync } from 'node:zlib';

export const SC_SITE = 'https://www.superclueai.com';
export const SC_TERMS =
  'Public Excel files the superclueai.com boards load; the site serves no robots.txt rules (the path returns the app) and publishes no terms of use.';

/** SuperCLUE names the resolver cannot place. */
export const SC_ALIASES: Record<string, string> = {
  'Doubao-Seed-2.1-pro(high)': 'seed-2-1-pro',
  // the resolver drops the date stamp and would pick a later GPT-4o snapshot by the row date
  'GPT-4o-2024-05-13': 'gpt-4o-may-2024',
  'GPT-3.5-0125': 'gpt-3-5-turbo-jan-2024',
  'Gemma-7b-it': 'gemma-7b',
};

/** Files in a zip archive, by name (stored or deflated entries). */
function unzip(buf: Buffer): Map<string, Buffer> {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip central directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    out.set(name, method === 8 ? inflateRawSync(data) : data);
  }
  return out;
}

const col = (ref: string) => [...ref.replace(/\d+$/, '')].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;

/** Every sheet of an .xlsx workbook as rows of cell text, by sheet name. */
export function readXlsx(buf: Buffer): Map<string, string[][]> {
  const files = unzip(buf);
  const xml = (name: string) => files.get(name)?.toString('utf8') ?? '';
  const shared = [...xml('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => text(t[1])).join(''),
  );
  const rels = new Map([...xml('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map((m) => [m[0].match(/Id="([^"]+)"/)?.[1], m[0].match(/Target="([^"]+)"/)?.[1]]));
  const sheets = new Map<string, string[][]>();
  for (const m of xml('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const name = text(m[0].match(/name="([^"]*)"/)?.[1] ?? '');
    const target = rels.get(m[0].match(/r:id="([^"]+)"/)?.[1]) ?? '';
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
    const rows: string[][] = [];
    for (const r of xml(path).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const row: string[] = [];
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = c[1].match(/r="([A-Z]+\d+)"/)?.[1];
        const type = c[1].match(/t="(\w+)"/)?.[1];
        const v = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        const inline = c[2]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
        const value = type === 's' && v !== undefined ? shared[Number(v)] : type === 'inlineStr' ? text(inline ?? '') : text(v ?? '');
        row[ref ? col(ref) : row.length] = value ?? '';
      }
      rows.push(Array.from(row, (x) => x ?? ''));
    }
    sheets.set(name, rows);
  }
  return sheets;
}

/** The text of the app's JS chunk whose file name starts with `prefix` (for example "GeneralBoardPage-"). */
export async function scChunk(prefix: string): Promise<string> {
  const page = await fetchText(`${SC_SITE}/`);
  const entry = page.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  if (!entry) throw new Error('entry script not found');
  const name = (await fetchText(SC_SITE + entry)).match(new RegExp(`${prefix}[\\w-]+\\.js`))?.[0];
  if (!name) throw new Error(`${prefix} chunk not found`);
  return fetchText(`${SC_SITE}/assets/${name}`);
}

/** "2026.9.10", "2024年10月12日" or "2024.11.26" to YYYY-MM-DD. */
function isoDate(s: string): string | undefined {
  const m = s.match(/(20\d\d)\D+(\d{1,2})\D+(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : undefined;
}

/** Rows of one sheet: the model column, the 总分 (total) column and the 发布日期 date when present. */
export async function scRows(file: string, sheet: string, modelCol: string): Promise<LeaderboardRow[]> {
  const res = await fetch(`${SC_SITE}${encodeURI(file)}`, { headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' } });
  if (!res.ok) throw new Error(`${res.status} ${file}`);
  const book = readXlsx(Buffer.from(await res.arrayBuffer()));
  const t = book.get(sheet);
  if (!t) throw new Error(`sheet ${sheet} not in ${file}: ${[...book.keys()].join(', ')}`);
  const head = t[0].map((h) => h.trim());
  const iModel = head.indexOf(modelCol);
  const iScore = head.indexOf('总分');
  const iDate = head.indexOf('发布日期');
  if (iModel < 0 || iScore < 0) throw new Error(`unexpected columns in ${sheet}: ${head.join(', ')}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    const model = r[iModel]?.trim();
    const score = num(r[iScore]);
    if (model && score !== undefined) rows.push({ model, score, date: iDate >= 0 ? isoDate(r[iDate] ?? '') : undefined });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'superclue',
  url: `${SC_SITE}/generalpage`,
  feed: `${SC_SITE}/data/generalboard/<round>.xlsx (总排行榜 sheet, 总分; round from the GeneralBoardPage chunk)`,
  terms: SC_TERMS,
  aliases: SC_ALIASES,
  async fetch() {
    const round = (await scChunk('GeneralBoardPage-')).match(/selectedDate:"([^"]+)"/)?.[1];
    if (!round) throw new Error('current round not found');
    return scRows(`/data/generalboard/${round}.xlsx`, '总排行榜', '模型名称');
  },
};
export default board;

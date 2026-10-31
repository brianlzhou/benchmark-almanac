// OSWorld-Verified. The leaderboard page (os-world.github.io, now served from osworld-v1.xlang.ai) loads
// static/data/osworld_verified_results.xlsx with SheetJS. One sheet row is one run. The page drops rows
// without a numeric "Success rate", groups the rest by Model and Max steps, and shows the mean success rate
// of each group; that mean is the score here. The xlsx is read with a small zip + XML reader (no dependency).
//
// Agentic frameworks name their model inside the Model cell ("Pointer Agent w/ Opus 4.7"): the part before
// " w/ " becomes the harness. Frameworks that name no model, or several ("w/ Opus 4.5 + GPT-5"), stay
// under their own name and simply do not match a registry model.
import { inflateRawSync } from 'node:zlib';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://osworld-v1.xlang.ai/static/data/osworld_verified_results.xlsx';

/** Files in a zip archive, read through the central directory. */
function unzip(buf: Buffer): Map<string, Buffer> {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    out.set(name, method === 8 ? inflateRawSync(raw) : raw);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unescapeXml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** The first worksheet as objects keyed by the header row, like SheetJS sheet_to_json. */
export function readXlsx(buf: Buffer): Record<string, string>[] {
  const files = unzip(buf);
  const text = (n: string) => files.get(n)?.toString('utf8') ?? '';
  const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  );
  const sheet = text('xl/worksheets/sheet1.xml');
  const grid: Record<string, string>[] = [];
  for (const row of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {};
    for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const type = c[2].match(/t="(\w+)"/)?.[1];
      const v = c[3]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inline = c[3]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      cells[c[1]] = type === 's' && v !== undefined ? shared[Number(v)] : unescapeXml(v ?? inline ?? '');
    }
    grid.push(cells);
  }
  const [head, ...body] = grid;
  return body.map((r) => Object.fromEntries(Object.entries(head).filter(([, h]) => h).map(([col, h]) => [h, r[col] ?? ''])));
}

/** Excel stores dates as days since 1899-12-30. */
const excelDate = (v: string) =>
  /^\d+(\.\d+)?$/.test(v) ? new Date(Date.UTC(1899, 11, 30) + Number(v) * 86_400_000).toISOString().slice(0, 10) : v || undefined;

/** "Pointer Agent w/ Opus 4.7" -> model "Opus 4.7", harness "Pointer Agent". */
export function splitAgent(name: string): { model: string; harness?: string } {
  const m = name.match(/^(.+?)\s+w\/\s*(.+)$/);
  if (!m || /\s\+\s/.test(m[2])) return { model: name };
  // "GPT-5 bBoN (N=10)": the sampling scheme belongs to the harness
  const extra = m[2].match(/^(.*?)\s+(bBoN.*)$/);
  return extra ? { model: extra[1], harness: `${m[1]} ${extra[2]}` } : { model: m[2], harness: m[1] };
}

const board: Leaderboard = {
  benchmark: 'osworld-verified',
  url: 'https://os-world.github.io/',
  feed: FEED,
  terms: 'Static file on the OSWorld project site; the OSWorld repository is Apache-2.0.',
  aliases: {
    // OpenAI's computer-using agent model; the registry has its one dated snapshot
    'computer-use-preview': 'computer-use-preview-2025-03-11',
    'claude-4-sonnet-20250514': 'claude-sonnet-4',
  },
  async fetch() {
    const res = await fetch(FEED, { headers: { 'user-agent': 'benchmark-almanac' }, signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`${res.status} ${FEED}`);
    const sheet = readXlsx(Buffer.from(await res.arrayBuffer()));
    const groups = new Map<string, { row: Record<string, string>; rates: number[]; date?: string }>();
    for (const r of sheet) {
      const rate = parseFloat(r['Success rate']);
      if (!r.Model || Number.isNaN(rate)) continue;
      const k = `${r.Model}_${r['Max steps']}`;
      const g = groups.get(k) ?? { row: r, rates: [] };
      g.rates.push(rate);
      const d = excelDate(r.Date);
      if (d && (!g.date || d > g.date)) g.date = d;
      groups.set(k, g);
    }
    const rows: LeaderboardRow[] = [];
    for (const { row, rates, date } of groups.values()) {
      let { model, harness } = splitAgent(row.Model.trim());
      // "claude-fable-5[1m]": the 1M-token context variant
      const ctx = model.match(/\[(\d+[km])\]$/i);
      if (ctx) model = model.slice(0, ctx.index);
      const steps = row['Max steps'] ? `${row['Max steps']} steps` : undefined;
      rows.push({
        model,
        score: rates.reduce((a, b) => a + b, 0) / rates.length,
        setting: [ctx ? `${ctx[1].toUpperCase()} context` : undefined, steps].filter(Boolean).join(', ') || undefined,
        harness,
        date,
      });
    }
    return rows;
  },
};
export default board;

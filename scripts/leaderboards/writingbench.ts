// WritingBench (Alibaba Qwen and partners). The WritingBench/WritingBench Space builds its board from
// score.xlsx in the Space repository: one row per model with Overall, domain and requirement columns. The
// page ranks by Overall, the critic model's mean score on a 0 to 100 scale (its 1 to 10 scores times 10), so
// Overall is the score. Model names are API ids, and a "-thinking" or "-nothinking" suffix marks the mode,
// which becomes the setting. The workbook is read with xlsxSheet, a small reader for one-sheet .xlsx files
// that other importers can reuse.
import { inflateRawSync } from 'node:zlib';
import type { Leaderboard, LeaderboardRow } from './types.ts';

/** Files inside a zip archive, by name (stored and deflated entries only). */
export function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip archive');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip central directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    if (method === 0) files.set(name, raw);
    else if (method === 8) files.set(name, inflateRawSync(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescape = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|apos|#\d+);/g, (_, e: string) =>
    e === 'amp' ? '&' : e === 'lt' ? '<' : e === 'gt' ? '>' : e === 'quot' ? '"' : e === 'apos' ? "'" : String.fromCodePoint(Number(e.slice(1))),
  );

/** The first worksheet of an .xlsx workbook as records keyed by the first row. */
export function xlsxSheet(buf: Buffer): Record<string, string>[] {
  const files = unzip(buf);
  const shared = [...(files.get('xl/sharedStrings.xml')?.toString('utf8') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unescape([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
  );
  const sheet = files.get('xl/worksheets/sheet1.xml')?.toString('utf8');
  if (!sheet) throw new Error('no first worksheet');
  const col = (ref: string) => [...ref.replace(/\d+$/, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const grid: string[][] = [];
  for (const row of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = c[1].match(/\br="([A-Z]+\d+)"/)?.[1];
      const type = c[1].match(/\bt="(\w+)"/)?.[1];
      const v = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const inline = c[2]?.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      const value = type === 's' ? shared[Number(v)] : type === 'inlineStr' ? unescape(inline ?? '') : unescape(v ?? '');
      cells[ref ? col(ref) : cells.length] = value ?? '';
    }
    grid.push(cells);
  }
  const [head, ...body] = grid;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const FEED = 'https://huggingface.co/spaces/WritingBench/WritingBench/resolve/main/score.xlsx';

const board: Leaderboard = {
  benchmark: 'writingbench',
  url: 'https://huggingface.co/spaces/WritingBench/WritingBench',
  feed: `${FEED} (Overall)`,
  terms: 'Workbook in the WritingBench/WritingBench Hugging Face Space, licensed Apache-2.0.',
  aliases: {
    // the plain names are the first releases: the board lists the later snapshots under their own dated names
    'deepseek-r1': 'deepseek-r1',
    'deepseek-v3': 'deepseek-v3',
    'deepseek-v3-250324': 'deepseek-v3-mar-2025',
    'doubao-seed-1-6-250615': 'doubao-seed-1-6',
    'doubao-seed-1-6-thinking-250615': 'seed-1-6-thinking',
    'llama-3.1-8b-instruct': 'llama-3-1-8b',
    'llama-3.2-1b-instruct': 'llama-3-2-1b',
    'llama-3.2-3b-instruct': 'llama-3-2-3b',
    'llama-4-maverick-17b-128e': 'llama-4-maverick',
    'llama-4-scout-17b-16e-instruct': 'llama-4-scout',
    'mistral-large-instruct-2411': 'mistral-large-2-nov-2024',
    'qwen-2.5-7b-instruct': 'qwen2-5-7b',
    'qwen3-235b-a22b-instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'grok-4-0709': 'grok-4',
    // the July 2025 release (the September update is named Kimi-K2-Instruct-0905)
    'kimi-k2-instruct': 'kimi-k2-jul-2025',
  },
  async fetch() {
    const res = await fetch(FEED, { headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' }, signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`${res.status} ${FEED}`);
    const rows: LeaderboardRow[] = [];
    for (const r of xlsxSheet(Buffer.from(await res.arrayBuffer()))) {
      const score = Number(r.Overall);
      if (!r.Model?.trim() || !Number.isFinite(score)) continue;
      let model = r.Model.trim();
      let setting: string | undefined;
      // "claude-opus-4-20250514-thinking", "qwen3-235b-a22b-nothinking": the mode as a suffix. The dated
      // Qwen3 2507 releases keep "thinking" in their names, so only the suffix after a size or a date counts.
      const mode = model.match(/^((?:claude-.*-\d{8})|(?:qwen3-[\d.]+b(?:-a\d+b)?))-(thinking|nothinking)$/);
      if (mode) {
        model = mode[1];
        setting = mode[2] === 'thinking' ? 'thinking' : 'non-thinking';
      }
      rows.push({ model, score, setting });
    }
    if (!rows.length) throw new Error('no rows in score.xlsx');
    return rows;
  },
};
export default board;

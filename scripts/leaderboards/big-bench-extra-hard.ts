// BIG-Bench Extra Hard (Google DeepMind). The makers keep the board as a markdown table in leaderboard.md in
// the google-deepmind/bbeh repository. The page sorts by "BBEH", the harmonic mean over the 23 tasks, and
// also lists "BBEH (Micro Avg)". The BBEH harmonic mean is the score, as the benchmark record defines.
// Micro averages from lab reports are a different metric and require separate catalog treatment.
// The "Random" baseline row is dropped. Rows from the original paper (arXiv
// 2502.19187, 2025-02-26) carry that date so the resolver picks the snapshots current then. The page's sort
// secondary columns, "BBEH (Micro Avg)" and "BBEH Mini (Micro Avg)", go in metrics as "micro" and "mini". Other importers that read README or markdown
// tables on GitHub use mdTables and ghRaw from this file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

/** A raw file in a public GitHub repository. */
export const ghRaw = (repo: string, path: string, branch = 'main') => `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

export interface MdTable {
  /** The heading line closest above the table, without the leading hashes. */
  heading: string;
  head: string[];
  rows: string[][];
}

/** Plain text of one markdown cell: links, images, emphasis, code marks and inline HTML removed. */
export function mdCell(s: string): string {
  return text(
    s
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/(\*\*|__|`)/g, '')
      .replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1$2'),
  );
}

/** Every pipe table in a markdown document, with the nearest heading above it. */
export function mdTables(md: string): MdTable[] {
  const lines = md.split('\n');
  const out: MdTable[] = [];
  let heading = '';
  const split = (l: string) => {
    const t = l.trim().replace(/^\|/, '').replace(/\|$/, '');
    return t.split(/(?<!\\)\|/).map((c) => mdCell(c.replace(/\\\|/g, '|')));
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,6}\s/.test(l)) heading = mdCell(l.replace(/^#+\s*/, ''));
    if (!/^\s*\|/.test(l) || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? '')) continue;
    const head = split(l);
    const rows: string[][] = [];
    let j = i + 2;
    for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) rows.push(split(lines[j]));
    out.push({ heading, head, rows });
    i = j - 1;
  }
  return out;
}

/** The rows of a markdown table as objects keyed by header text. */
export const mdRecords = (t: MdTable) => t.rows.map((r) => Object.fromEntries(t.head.map((h, i) => [h, r[i] ?? ''])));

const REPO = 'google-deepmind/bbeh';
const FEED = ghRaw(REPO, 'leaderboard.md');

const board: Leaderboard = {
  benchmark: 'big-bench-extra-hard',
  url: `https://github.com/${REPO}/blob/main/leaderboard.md`,
  feed: `${FEED} (BBEH harmonic mean)`,
  terms: 'Markdown file in the google-deepmind/bbeh GitHub repository, which is Apache-2.0.',
  aliases: {
    'Llama 3.1 8b Instruct': 'llama-3-1-8b',
    'Distill R1 Qwen 32b': 'deepseek-r1-distill-qwen-32b',
    'Gemma2 27b IT': 'gemma-2-27b',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.head.includes('BBEH (Micro Avg)'));
    if (!t) throw new Error('BBEH table not found');
    const iScore = t.head.indexOf('BBEH');
    if (iScore < 0) throw new Error('BBEH harmonic mean column not found');
    const iBy = t.head.indexOf('Contributed by');
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const model = r[0];
      const score = r[iScore]?.trim() ? Number(r[iScore]) : NaN;
      if (!model || /^random$/i.test(model) || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, col] of [['micro', 'BBEH (Micro Avg)'], ['mini', 'BBEH Mini (Micro Avg)']] as const) {
        const i = t.head.indexOf(col);
        const v = i >= 0 && r[i]?.trim() ? Number(r[i]) : NaN;
        if (Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({
        model,
        score,
        date: /original paper/i.test(r[iBy] ?? '') ? '2025-02-26' : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};
export default board;

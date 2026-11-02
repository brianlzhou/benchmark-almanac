// TOMATO (visual temporal reasoning in video). The repo README's leaderboard is an image of the paper's
// Table 7; the same table, with a few more models, is HTML in the arXiv paper (v2, 2025-08-25). This file
// reads Table 7 from arxiv.org/html (pinned to v2, so the numbers cannot shift) and takes the "All" column,
// accuracy on all 1,484 questions with 16 frames unless the model reads video directly. Baseline rows
// (human, random, frequent choice) are dropped. A static paper table, so rows carry the v2 date. Snapshot
// aliases follow the paper's Table 9 checkpoints.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://arxiv.org/html/2410.23266v2';
const TABLE = 'S6.T7.12';
const DATE = '2025-08-25';

/** Cells of a LaTeXML table by its id. Header cells hold nested tables, so cells are cut by their ids. */
function axTable(html: string, id: string): string[][] {
  const re = new RegExp(`<t[hd]\\b[^>]*\\bid="${id.replace(/\./g, '\\.')}\\.(\\d+)\\.(\\d+)"`, 'g');
  const hits = [...html.matchAll(re)];
  const rows: string[][] = [];
  hits.forEach((m, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].index! : html.indexOf('</table>', m.index!);
    (rows[Number(m[1]) - 1] ??= [])[Number(m[2]) - 1] = text(html.slice(m.index!, end));
  });
  return rows.filter(Boolean);
}

const board: Leaderboard = {
  benchmark: 'tomato',
  url: 'https://github.com/yale-nlp/TOMATO#2-leaderboard',
  feed: `${PAGE} (Table 7, All column)`,
  terms: 'arXiv robots.txt allows /html (crawl delay 15 s; one request per sync); the TOMATO repository carries no license, so only the published numbers are read.',
  aliases: {
    'GPT-4o': 'gpt-4o-aug-2024',
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet',
    'Gemini 1.5 pro': 'gemini-1-5-pro-may-2024',
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
    'Gemini 2.0 Flash Exp': 'gemini-2-0-flash-dec-2024',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'LLaVA-Video-72B': 'llava-video-72b-qwen2',
    'LLaVA-Video-7B': 'llava-video-7b-qwen2',
  },
  async fetch() {
    const t = axTable(await fetchText(PAGE), TABLE);
    const head = t[0] ?? [];
    const iAll = head.findIndex((h) => h === 'All');
    if (head[0] !== 'Model' || iAll < 0) throw new Error(`unexpected TOMATO header: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    let baselines = false;
    for (const r of t.slice(1)) {
      if (r.length === 1) {
        baselines = /baseline/i.test(r[0]);
        continue;
      }
      const model = r[0].replace(/[‡∗*†]/g, '').trim();
      const score = num(r[iAll]);
      if (baselines || !model || score === undefined) continue;
      rows.push({ model, score, date: DATE });
    }
    return rows;
  },
};
export default board;

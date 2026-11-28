// RedactionBench: 200 exhaustively annotated documents for sensitive-content and PII redaction scored with mean
// R-Score (0 to 1, where invalid outputs score 0). The CC BY 4.0 Hugging Face dataset README publishes the 44-model
// leaderboard table comparing frontier general-purpose agents and specialized token-level, span-level and generative
// PII detectors.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const PAGE = 'https://huggingface.co/datasets/RedactionBench/RedactionBench';
const FEED = `${PAGE}/raw/main/README.md`;

const board: Leaderboard = {
  benchmark: 'redactionbench',
  url: PAGE,
  feed: FEED,
  terms: 'RedactionBench is published under CC BY 4.0 on Hugging Face, and we read only the public README leaderboard table.',
  async fetch() {
    const md = await fetchText(FEED);
    const head = ['Rank', 'Model', 'Family', 'R-Score (mean)'];
    const table = markdownTables(md).find((t) => head.every((h, i) => t[0]?.[i] === h));
    if (!table) throw new Error('RedactionBench leaderboard table missing');
    const out: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      if (row.length < 4) continue;
      // Strip trailing " agent" label on Qwen agent rows so base models resolve cleanly; keep Family in setting
      const model = row[1].replace(/\s+agent$/i, '').trim();
      const setting = row[2].trim();
      const score = num(row[3]);
      if (!model || score === undefined) throw new Error(`RedactionBench row changed: ${row.join(' | ')}`);
      out.push({
        model,
        score,
        ...(setting ? { setting } : {}),
      });
    }
    if (out.length < 30) throw new Error(`RedactionBench table changed: only ${out.length} rows`);
    return out;
  },
};

export default board;

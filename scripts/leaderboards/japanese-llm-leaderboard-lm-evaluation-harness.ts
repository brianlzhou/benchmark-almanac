// Stability AI Japanese LLM Leaderboard (lm-evaluation-harness jp-stable branch) evaluates Japanese
// language models across eight tasks: JCommonsenseQA, JNLI, MARC-ja, JSQuAD, JAQKET v2, XL-Sum (ja),
// XWinograd (ja) and MGSM (ja). This importer reads the live Markdown leaderboard table in the repository
// README, keeping the reported average as the headline score and all eight tasks in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/Stability-AI/lm-evaluation-harness/jp-stable/README.md';

const TASK_COLS: [string, string][] = [
  ['jcommonsenseqa', 'JCommonsenseQA'],
  ['jnli', 'JNLI'],
  ['marc_ja', 'MARC-ja'],
  ['jsquad', 'JSQuAD'],
  ['jaqket_v2', 'JAQKET v2'],
  ['xlsum_ja', 'XL-Sum (ja)'],
  ['xwinograd_ja', 'XWinograd (ja)'],
  ['mgsm', 'MGSM (ja)'],
];

const parts: Record<string, BoardPart> = Object.fromEntries(
  TASK_COLS.map(([k, name]) => [k, { name, unit: 'score' }]),
);

const board: Leaderboard = {
  benchmark: 'japanese-llm-leaderboard-lm-evaluation-harness',
  url: 'https://github.com/Stability-AI/lm-evaluation-harness/tree/jp-stable#leaderboard',
  feed: FEED,
  terms: 'Public Stability AI lm-evaluation-harness repository on GitHub (MIT license). https://github.com/Stability-AI/lm-evaluation-harness/tree/jp-stable',
  aliases: {
    'llama2-13b-chat': 'llama-2-13b',
    'llama2-13b': 'llama-2-13b',
    'llama2-7b-chat': 'llama-2-7b',
    'llama2-7b': 'llama-2-7b',
  },
  parts,
  async fetch() {
    const md = await fetchText(FEED);
    const lines = md.split(/\r?\n/);
    const start = lines.findIndex((l) => /^##\s+Leaderboard\b/i.test(l.trim()));
    if (start < 0) throw new Error('Japanese LLM Leaderboard section missing in README');
    const tableLines: string[] = [];
    for (let i = start + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|')) tableLines.push(line);
      else if (tableLines.length) break;
    }
    if (tableLines.length < 15) throw new Error(`Expected at least 15 table lines, got ${tableLines.length}`);

    const headers = tableLines[0].split('|').slice(1, -1).map((c) => c.trim().toLowerCase());
    const avgIdx = headers.indexOf('average');
    if (avgIdx < 0) throw new Error('Missing average column in Japanese LLM Leaderboard table');
    const taskIdxs = TASK_COLS.map(([k]) => {
      const idx = headers.indexOf(k);
      if (idx < 0) throw new Error(`Missing ${k} column in Japanese LLM Leaderboard table`);
      return [k, idx] as const;
    });

    const rows: LeaderboardRow[] = [];
    for (const line of tableLines.slice(2)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length < avgIdx + 1) continue;
      const rawModel = cells[0].replace(/<[^>]+>/g, '').trim();
      const link = cells[0].match(/href="([^"]+)"/)?.[1];
      const score = Number(cells[avgIdx]);
      if (!rawModel || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [k, idx] of taskIdxs) {
        const v = Number(cells[idx]);
        if (Number.isFinite(v)) metrics[k] = v;
      }
      let setting: string | undefined;
      if (/^llama2-(?:7|13)b-chat$/i.test(rawModel)) setting = 'chat';
      else if (/^llama2-(?:7|13)b$/i.test(rawModel)) setting = 'base';
      rows.push({
        model: rawModel,
        score,
        setting,
        link: link?.startsWith('https://') ? link : undefined,
        metrics,
      });
    }
    if (rows.length < 15) throw new Error(`Parsed only ${rows.length} Japanese LLM Leaderboard rows`);
    return rows;
  },
};

export default board;

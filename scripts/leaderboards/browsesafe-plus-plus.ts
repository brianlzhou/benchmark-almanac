// BrowseSafe++ (Perplexity): prompt-injection detection on 9,175 held-out page pairs. browsesafe.perplexity.ai
// renders data/leaderboard.json. Its first board ("Detection: text views") opens on the derived Average view
// sorted by F1: the mean of each detector's F1 on the HTML, Markdown and accessibility-tree views (0 to
// 100), which is the score here. The efficiency block gives, per prompted model, the cost per 1,000 pages
// and output tokens per page; cost per page (task) is that cost over 1,000. "Claude Fable 5.1 (answered)"
// scores only the pages it did not refuse and is kept with that as the setting; "(all)" counts refusals as
// flags. The fine-tuned BrowseSafe-Guard and the screenshot and adaptive-attack boards are not models in
// the registry or are separate tasks, and are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://browsesafe.perplexity.ai/data/leaderboard.json';
const VIEWS = ['html', 'markdown', 'accessibility'] as const;

interface Row {
  model: string;
  badges?: string[];
  html?: { f1?: number };
  markdown?: { f1?: number };
  accessibility?: { f1?: number };
}
interface Data {
  boards: { id: string; rows: Row[] }[];
  efficiency?: { models?: Record<string, { cost_usd_per_1k_pages?: number; tokens_out?: number }> };
}

const board: Leaderboard = {
  benchmark: 'browsesafe-plus-plus',
  url: 'https://browsesafe.perplexity.ai/',
  feed: `${FEED} (text board, Average view, F1)`,
  terms: 'Static JSON the BrowseSafe++ site publishes as raw results; the repository is MIT (the test inputs are licensed for evaluation only, and are not read).',
  aliases: {
    'GPT-OSS 20B': 'gpt-oss-20b',
    'Mistral NeMo': 'mistral-nemo',
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const text = data.boards.find((b) => b.id === 'text');
    if (!text) throw new Error('no text board in the BrowseSafe++ leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const r of text.rows) {
      if (r.badges?.includes('guard')) continue;
      const f1 = VIEWS.map((v) => r[v]?.f1).filter((x): x is number => typeof x === 'number');
      if (f1.length !== VIEWS.length) continue;
      const variant = r.model.match(/\s*\((all|answered)\)$/);
      const model = variant ? r.model.slice(0, variant.index) : r.model;
      const eff = data.efficiency?.models?.[r.model] ?? data.efficiency?.models?.[model];
      rows.push({
        model,
        score: f1.reduce((a, b) => a + b, 0) / f1.length,
        setting: variant?.[1] === 'answered' ? 'answered pages only' : undefined,
        cost: eff?.cost_usd_per_1k_pages ? eff.cost_usd_per_1k_pages / 1000 : undefined,
        tokens: eff?.tokens_out,
      });
    }
    return rows;
  },
};
export default board;

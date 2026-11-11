// BrowseSafe++ (Perplexity): prompt-injection detection on 9,175 held-out page pairs. browsesafe.perplexity.ai
// renders data/leaderboard.json. Its first board ("Detection: text views") opens on the derived Average view
// sorted by F1: the mean of each detector's F1 on the HTML, Markdown and accessibility-tree views (0 to
// 100), which is the score here. The efficiency block gives, per prompted model, the cost per 1,000 pages
// and output tokens per page; cost per page (task) is that cost over 1,000. The efficiency block's median
// latency per page is kept as metrics.latency (seconds), and the three views' mean accuracy and false-positive
// rate as metrics.acc and metrics.fpr; the site's "Accuracy and latency" chart plots acc against latency.
// The site defines Average: "Average is the unweighted mean of the HTML, Markdown and accessibility-tree values, computed by this site."
// Claude Fable 5.1 (all) counts refusals as flags and is its only headline row.
// Answered-only F1 stays in metrics. The board gives refusals as a range, so coverageLow and coverageHigh
// preserve the complementary percentage range. They are bounds, not an estimated exact coverage.
// Fine-tuned guards are preserved as unlisted rows. Screenshot and adaptive-attack results are separate tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://browsesafe.perplexity.ai/data/leaderboard.json';
const VIEWS = ['html', 'markdown', 'accessibility'] as const;

interface Row {
  model: string;
  badges?: string[];
  html?: { f1?: number; acc?: number; fpr?: number };
  markdown?: { f1?: number; acc?: number; fpr?: number };
  accessibility?: { f1?: number; acc?: number; fpr?: number };
}
interface Data {
  boards: { id: string; rows: Row[]; notes?: string[] }[];
  efficiency?: { models?: Record<string, { cost_usd_per_1k_pages?: number; tokens_out?: number; latency_s?: number }> };
}

const board: Leaderboard = {
  benchmark: 'browsesafe-plus-plus',
  url: 'https://browsesafe.perplexity.ai/',
  feed: `${FEED} (text board, Average view, F1)`,
  terms: 'Static JSON the BrowseSafe++ site publishes as raw results; the repository is MIT (the test inputs are licensed for evaluation only, and are not read).',
  aliases: {
    'GPT-OSS 20B': 'gpt-oss-20b',
    'Mistral NeMo': 'mistral-nemo',
    // the board's model card links Qwen3-30B-A3B-Instruct-2507
    'Qwen3 30B-A3B': 'qwen3-30b-a3b-instruct-jul-2025',
  },
  chart: {
    title: 'Accuracy and latency',
    note: 'Mean text-view accuracy against the median seconds per page for one detection call, on a log scale.',
    x: { key: 'latency', label: 'Latency per page', unit: 's', better: 'lower', log: true },
    y: { key: 'acc', label: 'Accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const text = data.boards.find((b) => b.id === 'text');
    if (!text) throw new Error('no text board in the BrowseSafe++ leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const r of text.rows) {

      if (/\(answered\)$/.test(r.model)) continue;
      const f1 = VIEWS.map((v) => r[v]?.f1).filter((x): x is number => typeof x === 'number');
      if (f1.length !== VIEWS.length) continue;
      const variant = r.model.match(/\s*\((all|answered)\)$/);
      const model = variant ? r.model.slice(0, variant.index) : r.model;
      const eff = data.efficiency?.models?.[r.model] ?? data.efficiency?.models?.[model];
      const mean = (k: 'acc' | 'fpr') => {
        const v = VIEWS.map((x) => r[x]?.[k]).filter((x): x is number => typeof x === 'number');
        return v.length === VIEWS.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
      };
      const metrics: Record<string, number> = {};
      if (variant?.[1] === 'all') {
        const answered = text.rows.find((x) => x.model === `${model} (answered)`);
        const answeredF1 = VIEWS.map((v) => answered?.[v]?.f1);
        if (answeredF1.every((v): v is number => typeof v === 'number' && Number.isFinite(v))) {
          metrics.answeredF1 = answeredF1.reduce((a, b) => a + b, 0) / VIEWS.length;
        }
        const refusalNote = text.notes?.find((n) => n.includes(model) && /refuses/i.test(n));
        const range = refusalNote?.match(/refuses\s+(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)%/i);
        if (range) {
          const [low, high] = [Number(range[1]), Number(range[2])];
          if (0 <= low && low <= high && high <= 100) {
            metrics.coverageLow = 100 - high;
            metrics.coverageHigh = 100 - low;
          }
        }
      }
      if (typeof eff?.latency_s === 'number') metrics.latency = eff.latency_s;
      const acc = mean('acc');
      const fpr = mean('fpr');
      if (acc !== undefined) metrics.acc = acc;
      if (fpr !== undefined) metrics.fpr = fpr;
      rows.push({
        model,
        score: f1.reduce((a, b) => a + b, 0) / f1.length,
        cost: eff?.cost_usd_per_1k_pages ? eff.cost_usd_per_1k_pages / 1000 : undefined,
        tokens: eff?.tokens_out,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;

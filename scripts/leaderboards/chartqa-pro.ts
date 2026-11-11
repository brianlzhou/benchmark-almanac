// ChartQA Pro: the main table publishes Overall accuracy for Direct, Chain-of-Thought and Program-of-Thought prompts.
//  Each prompt runs the whole benchmark and becomes a setting. Five question-type scores remain metrics.
//  These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2504.05506";
import { paperTables, paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "chartqa-pro",
  url: "https://raw.githubusercontent.com/vis-nlp/ChartQAPro/main/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED)).find(t => t[0]?.some(c => c.text === 'Program-of-Thought (PoT)'));
    if (!t) throw new Error('ChartQA Pro main table missing');
    const out: LeaderboardRow[] = [];
    for (const r of t) {
      if (r.length !== 19 || /^Human/.test(r[0].text) || num(r[6].text) === undefined) continue;
      ['Direct', 'Chain-of-Thought', 'Program-of-Thought'].forEach((setting, i) => {
        const score = num(r[6 + i * 6].text);
        if (score === undefined) throw new Error('ChartQA Pro overall missing');
        const metrics: Record<string, number> = {};
        ['factoid', 'mcq', 'conversation', 'factChecking', 'hypothetical'].forEach((k,j) => {metrics[k] = num(r[1+i*6+j].text)!;});
        out.push({model: paperModel(r[0].text), score, setting, metrics});
      });
    }
    if (out.length !== 63) throw new Error(`ChartQA Pro expected 63 rows, found ${out.length}`);
    return out;
  },
};
export default board;

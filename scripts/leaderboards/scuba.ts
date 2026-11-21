// SCUBA measures task success in Salesforce workflows. The site bundle supplies zero-shot and demonstration results with time, cost and token counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://sfrcua.github.io/SCUBA/_astro/PerformanceTable.KJhwyB8y.js";

const board: Leaderboard = {
  benchmark: "scuba",
  url: "https://sfrcua.github.io/SCUBA/#leaderboard",
  feed,
  terms: "Salesforce lists nine agent configurations for each of two settings. The site repository uses Apache 2.0. https://github.com/sfrcua/SCUBA/blob/main/LICENSE GitHub Pages returns 404 for robots.txt.",
  reference: ['browser', 'computer'], harnesses: 'system', aliases: { 'Claude-4-sonnet': 'claude-sonnet-4' },
  async fetch() {
    const source = await fetchText(feed);
    const start = source.indexOf('[{method:');
    if (start < 0) throw new Error('Missing SCUBA table');
    type Run = { method:string, milestoneScore:number, successRate:number, time:number, steps:number, tokens:number, costs:string|number, category:string, setting:string };
    const normalized = source.slice(start).replace(/([:,])\.(\d)/g, '$10.$2');
    const runs = jsLiteral<Run[]>(normalized, 0);
    if (runs.length < 18) throw new Error('Missing SCUBA configurations');
    return runs.map(r => {
      if (!r.method || !r.setting || ![r.successRate, r.milestoneScore, r.time, r.steps, r.tokens].every(Number.isFinite)) throw new Error('Incomplete SCUBA result');
      const agent = r.method === 'Agent-S2.5(w/GPT-5)';
      const cost = parseFloat(String(r.costs));
      return { model: agent ? 'GPT-5' : r.method.replace(' (computer)', ''), harness: agent ? 'Agent-S2.5' : r.category,
        setting: r.setting, score: r.successRate, cost: Number.isFinite(cost) ? cost : undefined,
        metrics: { milestoneScore: r.milestoneScore, timeMinutes: r.time, steps: r.steps, totalTokens: Math.round(r.tokens * 1000) } };
    });
  },
};

export default board;

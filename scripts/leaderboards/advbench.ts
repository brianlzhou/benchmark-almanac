// AdvBench tests whether language models refuse 520 harmful behavior requests and 574 harmful target strings
// under adversarial prompt attacks. The score is the attack success rate (ASR) in percent, where lower is better.
// This importer reads Tables 1 and 2 of the AdvBench paper (Zou et al., 2023): Table 1 reports white-box
// attack success rates on Vicuna-7B and LLaMA-2-7B-Chat across four attack methods, using the held-out
// multiple harmful behaviors test ASR as the headline and keeping Harmful String ASR, Harmful String loss,
// individual Harmful Behavior ASR and training ASR in metrics. Table 2 reports transfer ASR on five commercial
// models averaged over 388 harmful behaviors across six prompt and GCG suffix settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2307.15043';

const num = (s: string | undefined, label: string): number => {
  const clean = (s ?? '').trim();
  if (!/^\d+(?:\.\d+)?$/.test(clean)) throw new Error(`AdvBench invalid number for ${label}: "${s}"`);
  return Number(clean);
};

const board: Leaderboard = {
  benchmark: 'advbench',
  static: 'paper',
  url: 'https://arxiv.org/abs/2307.15043',
  feed: FEED,
  terms: PAPER_TERMS,
  parts: {
    harmfulStringAsr: { name: 'Harmful Strings', group: 'White-box subset', unit: '%', better: 'lower' },
    individualBehaviorAsr: { name: 'Individual Harmful Behavior', group: 'White-box subset', unit: '%', better: 'lower' },
    multipleTrainAsr: { name: 'Multiple Harmful Behaviors (train)', group: 'White-box subset', unit: '%', better: 'lower' },
  },
  stats: {
    harmfulStringLoss: { name: 'Harmful String cross-entropy loss', unit: 'score', better: 'higher', note: 'Cross-entropy loss between output logits and the target harmful string, where higher loss means stronger resistance.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const t1 = tables.find((t) => t.some((r) => r[1] === 'Method' && r.includes('test ASR (%)')));
    const t2 = tables.find((t) => t.some((r) => r[0] === 'Method' && r[1] === 'Optimized on' && r.includes('GPT-4')));
    if (!t1 || !t2) throw new Error('AdvBench paper Table 1 or Table 2 missing');

    const rows: LeaderboardRow[] = [];

    // Table 1: white-box single-model ASR on Vicuna-7B (4 methods) and LLaMA-2-7B-Chat (4 methods)
    const t1Header = t1.findIndex((r) => r[1] === 'Method' && r.includes('test ASR (%)'));
    const t1Body = t1.slice(t1Header + 1);
    if (t1Body.length !== 8) throw new Error(`AdvBench Table 1 expected 8 rows, got ${t1Body.length}`);
    for (let i = 0; i < t1Body.length; i++) {
      const r = t1Body[i];
      const model = i < 4 ? 'Vicuna-7B' : 'LLaMA-2-7B-Chat';
      const method = r[1].replace(/\s*\(ours\)$/i, '').trim();
      if (!method) throw new Error(`AdvBench Table 1 missing method at row ${i}`);
      rows.push({
        model,
        setting: `White-box ${method}`,
        score: num(r[6], `${model} ${method} test ASR`),
        metrics: {
          harmfulStringAsr: num(r[2], `${model} ${method} HS ASR`),
          harmfulStringLoss: num(r[3], `${model} ${method} HS loss`),
          individualBehaviorAsr: num(r[4], `${model} ${method} HB ASR`),
          multipleTrainAsr: num(r[5], `${model} ${method} train ASR`),
        },
      });
    }

    // Table 2: transfer ASR across five models (388 harmful behaviors)
    const t2Header = t2.findIndex((r) => r[0] === 'Method' && r[1] === 'Optimized on');
    const colModels: Record<string, string> = {
      'GPT-3.5': 'gpt-3.5-turbo',
      'GPT-4': 'gpt-4-0314',
      'Claude-1': 'claude-instant-1',
      'Claude-2': 'Claude 2',
      'PaLM-2': 'PaLM-2',
    };
    const headers = t2[t2Header].slice(2).map((h) => colModels[h.trim()]);
    if (headers.length !== 5 || headers.some((h) => !h)) throw new Error('AdvBench Table 2 model columns changed');
    const t2Body = t2.slice(t2Header + 1);
    if (t2Body.length !== 6) throw new Error(`AdvBench Table 2 expected 6 attack rows, got ${t2Body.length}`);
    for (const r of t2Body) {
      const method = r[0].replace(/[“”]/g, '"').replace(/’/g, "'").trim();
      const opt = r[1].trim();
      const setting = opt && opt !== '-' ? `${method} (${opt})` : method;
      headers.forEach((model, j) => {
        rows.push({
          model,
          setting,
          score: num(r[j + 2], `${model} ${setting}`),
        });
      });
    }

    return checked(rows, 38);
  },
};

export default board;

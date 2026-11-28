// OpenART (Open Agent Red Teaming) reports Strict Attack Success Rate (%) across 15 agent runtimes and 5 foundation models.
// Lower Strict ASR is better. Pooled rows carry each model's aggregate score across all 15 agents while each (agent, model) cell is a system row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = 'https://ai45lab.github.io/OpenART/';

const board: Leaderboard = {
  benchmark: 'openart-ai45lab',
  static: 'paper',
  url: feed,
  feed,
  terms: 'The Shanghai AI Lab AI45Lab authors publish the 15-agent by 5-model evaluation matrix on their project page and in arXiv:2608.00677.',
  harnesses: 'system',
  aliases: {
    'Opus-4.8': 'claude-opus-4-8',
    'Qwen-3.7-Max': 'qwen3-7-max',
  },
  async fetch() {
    const html = await fetchText(feed);
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
    const target = tables.find((t) => /Agent\s*\/\s*model/i.test(t) && /Pooled/i.test(t));
    if (!target) throw new Error('Missing OpenART 15x5 agent-model Strict ASR table');
    const trs = target.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const parsed = trs.map((tr) =>
      (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map((cell) => text(cell).trim()),
    );
    const header = parsed[0] ?? [];
    const models = header.slice(1);
    if (models.length < 5) throw new Error(`Expected 5 foundation model columns, got ${models.length}`);
    const rows: LeaderboardRow[] = [];
    for (const cells of parsed.slice(1)) {
      const agent = cells[0];
      if (!agent || cells.length < models.length + 1) continue;
      const isPooled = /^Pooled$/i.test(agent);
      for (let i = 0; i < models.length; i++) {
        const val = Number(cells[i + 1]);
        if (!Number.isFinite(val)) continue;
        if (isPooled) {
          rows.push({ model: models[i], score: val, setting: 'Pooled across 15 agents' });
        } else {
          rows.push({ model: models[i], harness: agent, score: val });
        }
      }
    }
    if (rows.length < 80) throw new Error(`Expected 80 OpenART rows (75 settings plus 5 pooled), got ${rows.length}`);
    return rows;
  },
};

export default board;

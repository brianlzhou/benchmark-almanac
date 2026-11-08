// GitTaskBench: Task Pass Rate (TPR) measures successful task outputs over all 54 tasks.
// Execution Completion Rate is diagnostic, not the headline score. Frameworks become harnesses.
// Table 3 contains model runs; Table 8 adds whole-benchmark OpenHands/GPT-4o timeout and iteration settings.
// Reported cost and token figures accompany each run. The paper's Pareto curve is cumulative alpha across
// repositories, not a model score-versus-cost chart, so it is not reproduced as a board chart.
// These are static paper results and will not refresh with new models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-round3-t.ts';

const FEED = 'https://arxiv.org/html/2508.18993';
const NAMES: Record<string, string> = {
  'GPT-4o': 'gpt-4o-2024-08-06', 'Claude 3.5': 'claude-3-5-sonnet-20241022',
  'Claude 3.7': 'claude-3-7-sonnet-20250219', 'DeepSeekV3': 'DeepSeek-V3-0324',
  'Gemini-2.5-pro': 'Gemini 2.5 Pro (snapshot unspecified)',
};
function numbers(c: string[]) {
  const metrics = { executionCompletion: numberCell(c[0]), inputTokens: numberCell(c[2]) * 1000 };
  return { score: numberCell(c[1]), tokens: numberCell(c[3]), cost: c[4] === '-' ? undefined : numberCell(c[4]), metrics };
}
const board: Leaderboard = {
  benchmark: 'gittaskbench', url: 'https://github.com/QuantaAlpha/GitTaskBench', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'DeepSeek-V3-0324': 'deepseek-v3-mar-2025' },
  async fetch() {
    const all = await paperTables(FEED);
    const table = all.find(t => t[0]?.[0]?.text === 'Framework' && t[0]?.[1]?.text === 'LLM');
    if (!table) throw new Error('GitTaskBench model table missing');
    const rows: LeaderboardRow[] = [];
    let harness = '';
    for (const c of table.slice(1)) {
      const v = c.map(x => x.text);
      if (v.length === 7) { if (v[0]) harness = v[0]; v.shift(); }
      if (v.length !== 6 || !harness) throw new Error('GitTaskBench table shape changed');
      const raw = v[0];
      const model = raw.replace(/[∗†]/g, '');
      rows.push({ model: NAMES[model] ?? model, harness,
        setting: model === 'o3-mini' ? 'medium' : /Qwen3/.test(model) ? (raw.includes('†') ? 'thinking' : 'non-thinking') : undefined,
        ...numbers(v.slice(1)),
      });
    }
    const ablations = all.find(t => t[0]?.[0]?.text === 'Setting' && t.some(c => c.some(v => v.text === 'max_iteration=100')));
    if (!ablations) throw new Error('GitTaskBench whole-set settings table missing');
    for (const c of ablations.slice(1)) {
      if (c.length === 1) continue;
      if (c.length !== 7) throw new Error('GitTaskBench settings table shape changed');
      const setting = c[1].text;
      if (setting === 'timeout=600 s') continue; // identical to the default OpenHands row
      rows.push({ model: NAMES['GPT-4o'], harness: 'OpenHands', setting,
        ...numbers(c.slice(2).map(v => v.text)),
      });
    }
    if (rows.length < 31) throw new Error('GitTaskBench runs missing');
    return rows;
  },
};
export default board;

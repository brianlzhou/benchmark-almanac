// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Tables 2 through 4 report average pass@1 for Verilog generation, Python reference generation and Verilog debugging.
// Table 5 reports token use and cost for Verilog generation.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2601.21448';
const tasks = ['Verilog generation', 'Python reference model generation', 'Verilog debugging'];
const parts: Record<string, BoardPart> = {};
for (const [task, categories] of [
  ['Verilog generation', ['CPU IP', 'Non-Self-Contained', 'Self-Contained', 'Average']],
  ['Python reference model generation', ['CPU IP', 'Non-Self-Contained', 'Self-Contained', 'Average']],
  ['Verilog debugging', ['Arithmetic Bug', 'Assignment Bug', 'State Machine Bug', 'Timing Bug', 'Average']],
] as const) {
  for (const category of categories) {
    for (const pass of ['1', '5', '10']) {
      const key = (task + category + 'pass' + pass).replace(/[^a-z0-9]/gi, '');
      parts[key] = { name: `${task}: ${category} pass@${pass}`, group: task, unit: '%' };
    }
  }
}
const board: Leaderboard = {
  benchmark: 'chipbench', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the tables through arXiv. https://arxiv.org/abs/2601.21448',
  stats: {
    verilogInputTokens: { name: 'Verilog input tokens', unit: 'tokens' }, verilogOutputTokens: { name: 'Verilog output tokens', unit: 'tokens' },
    verilogCost: { name: 'Verilog generation cost', unit: 'usd', better: 'lower' }, verilogCostPerPass: { name: 'Verilog cost per pass', unit: 'usd', better: 'lower' },
  },
  headline: 'The paper reports no overall score, so the headline is the plain mean of pass@1 across its three tasks.',
  aliases: { 'DeepSeek-Coder': 'deepseek-v2-5-sep-2024', 'Claude 4.5 Haiku': 'claude-haiku-4-5', 'Claude 4.5 Opus': 'claude-opus-4-5', 'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'DeepSeek-R1 (snapshot unspecified)': 'deepseek-r1', 'Gemini 2.5 Pro (snapshot unspecified)': 'gemini-2-5-pro-jun-2025',
    'GPT-3.5 Turbo (snapshot unspecified)': 'gpt-3-5-turbo-jan-2024', 'GPT-4o (snapshot unspecified)': 'gpt-4o-nov-2024' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[0][0] === 'Model/Dataset' && t[0].at(-1) === 'Average' && t[1].at(-1) === 'pass@10');
    const cost = tables.find(t => t[0][1] === 'Input (Tokens)' && t[0][3] === 'Cost ($)');
    if (results.length !== 3 || !cost || results[2][0][1] !== 'Arithmetic Bug') throw new Error('Missing ChipBench task or cost table');
    const rows = new Map<string, LeaderboardRow>();
    for (const [i, t] of results.entries()) {
      const task = tasks[i];
      for (const [name, ...values] of t.slice(2)) {
        // Table 4 spells out the version of the DeepSeek-Coder entry identified in Table 6.
        const model = name === 'DeepSeek-Coder-V2.5' ? 'DeepSeek-Coder' : name;
        const r = rows.get(model) ?? { model, score: 0, metrics: {} as Record<string,number> };
        values.forEach((v, j) => {
          if (v === '-') return;
          const label = t[0][j+1] + ' ' + t[1][j+1];
          const key = (task + label).replace(/[^a-z0-9]/gi, '');
          parts[key] = { name: task + ': ' + label, group: task };
          r.metrics![key] = numberCell(v);
        });
        rows.set(model, r);
      }
    }
    for (const [model, input, output, usd,,costPerPass] of cost.slice(1)) {
      const r = rows.get(model);
      if (!r) throw new Error('Missing model ' + model);
      Object.assign(r.metrics!, { verilogInputTokens: numberCell(input.replaceAll(',','')), verilogOutputTokens: numberCell(output.replaceAll(',','')),
        verilogCost: numberCell(usd), verilogCostPerPass: numberCell(costPerPass) });
    }
    const keys = tasks.map(task => task.replaceAll(' ', '') + 'Averagepass1');
    const complete = [...rows.values()].filter(r => keys.every(k => r.metrics![k] !== undefined));
    for (const r of complete) r.score = keys.reduce((sum, k) => sum + r.metrics![k], 0) / keys.length;
    return checked(complete, 13);
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Table 1 reports success on 40 bounties for each of three tasks, with up to three attempts per task.
// The table also reports token costs and the combined dollar value of successful detections and patches.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2505.15216';
const board: Leaderboard = {
  benchmark: 'bountybench', static: 'paper', url: feed, feed, harnesses: 'system',
  terms: 'Stanford publishes the aggregate evaluation results on arXiv. https://arxiv.org/abs/2505.15216',
  stats: {
    detectBounty: { name: 'Detect bounty value', unit: 'usd', better: 'higher', note: 'Combined dollar value of successful vulnerability detections.' },
    detectTokenCost: { name: 'Detect token cost', unit: 'usd', better: 'lower' },
    exploitTokenCost: { name: 'Exploit token cost', unit: 'usd', better: 'lower' },
    patchBounty: { name: 'Patch bounty value', unit: 'usd', better: 'higher', note: 'Combined dollar value of successful vulnerability patches.' },
    patchTokenCost: { name: 'Patch token cost', unit: 'usd', better: 'lower' },
  },
  headline: 'The paper reports no overall score, so this is the plain mean of success rates for Detect, Exploit and Patch.',
  parts: { detect: 'Detect', exploit: 'Exploit', patch: 'Patch' },
  aliases: { 'Gemini 2.5 Pro Preview (03-25)': 'gemini-2-5-pro-mar-2025', 'DeepSeek-R1 (snapshot unspecified)': 'deepseek-r1' },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Agent|Detect|Detect|Detect|Exploit|Exploit|Patch|Patch|Patch');
    if (!t || t[1].join('|') !== '|Success|Bounty|Token|Success|Token|Success|Bounty|Token') throw new Error('Missing aggregate success and cost columns');
    return checked(t.slice(3).map(([agent, ...cells]) => {
      const [harness, label] = agent.split(': ');
      const model = harness === 'Claude Code' || label === 'Claude 3.7' ? 'Claude 3.7 Sonnet' :
        label === 'Gemini 2.5' ? 'Gemini 2.5 Pro Preview (03-25)' : label === 'o3-high' ? 'o3' : label;
      const settings = [label === 'o3-high' ? 'High reasoning effort' : label === 'Claude 3.7' ? 'Thinking' : '', 'Up to three attempts'];
      const numbers = cells.map((c, i) => {
        const raw = [0,3,5].includes(i) ? /^(\d+(?:\.\d+)?)%$/.exec(c) : /^\$([\d,]+)$/.exec(c);
        if (!raw) throw new Error('Invalid aggregate result for ' + agent);
        return Number(raw[1].replaceAll(',', ''));
      });
      const [detect, detectBounty, detectTokenCost, exploit, exploitTokenCost, patch, patchBounty, patchTokenCost] = numbers;
      return { model, harness, setting: settings.filter(Boolean).join(', '), score: (detect + exploit + patch) / 3,
        metrics: { detect, detectBounty, detectTokenCost, exploit, exploitTokenCost, patch, patchBounty, patchTokenCost } };
    }), 10);
  },
};
export default board;

// AudioTrust evaluates the trustworthiness of audio language models across six dimensions.
// The paper gives no overall score. Table 1 lists social stereotype group fairness first.
// Tables 2 through 6 use separate units and evaluators, so their scores stay in named parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.16211';
const specs = [
  { header: 'CM', group: 'Hallucination', names: ['Content mismatch', 'Label mismatch', 'Logical violation', 'Physical violation'], unit: 'score' },
  { header: 'Jailbreak', group: 'Safety', names: ['Enterprise', 'Financial', 'Medical', 'Illegal activities guidance'], unit: '%' },
  { header: 'Direct leakage', group: 'Privacy', names: ['Direct leakage without privacy prompting', 'Direct leakage with privacy prompting', 'Inference leakage without privacy prompting', 'Inference leakage with privacy prompting'], unit: '%' },
  { header: 'AR', group: 'Robustness', names: ['Adversarial robustness', 'Audio quality variation', 'Background conversation', 'Environmental sound', 'Multiple speakers', 'Noise interference'], unit: 'score' },
  { header: 'IVB', group: 'Authentication', names: ['Identity verification bypass', 'Hybrid spoofing', 'Voice cloning spoofing'], unit: '%' },
] as const;
const parts: Record<string, BoardPart> = {
  stereotypes: { name: 'Social stereotypes', group: 'Fairness' },
  decision: { name: 'Decision-making', group: 'Fairness' },
};
const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const value = (s: string) => numberCell(s.split(' ')[0]);
const board: Leaderboard = {
  benchmark: 'audiotrust', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish their results on arXiv. https://arxiv.org/abs/2505.16211',
  headline: 'The paper gives no overall score, so the headline is its first metric, group fairness for social stereotypes.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const fairness = tables.find(t => t[0][1] === '\\Gamma_{stereo}' && t[0][2] === '\\Gamma_{decision}');
    if (!fairness) throw new Error('Missing fairness results');
    const rows = new Map<string, LeaderboardRow>();
    for (const [model, stereo, decision] of fairness.slice(1)) {
      if (model === stereo || model === 'Average') continue;
      rows.set(key(model), { model, score: value(stereo), metrics: { stereotypes: value(stereo), decision: value(decision) } });
    }
    for (const spec of specs) {
      const table = tables.find(t => t[0][1] === spec.header && t[0].length === spec.names.length + 1);
      if (!table) throw new Error('Missing ' + spec.group + ' table');
      for (const [model, ...cells] of table.slice(1)) {
        if (model === cells[0] || /^(Model|Average)|Avg\.$/.test(model)) continue;
        const row = rows.get(key(model));
        if (!row) throw new Error('Unrecognized model ' + model);
        spec.names.forEach((name, i) => {
          if (cells[i] === 'N/A') return;
          const values = cells[i].split(/\s+\/\s+/);
          const judges = name === 'Voice cloning spoofing' ? [''] : ['GPT-4o', 'Qwen3'];
          if (values.length !== judges.length) throw new Error('Missing evaluator for ' + name);
          judges.forEach((judge, j) => {
            const label = judge ? name + ' (' + judge + ')' : name;
            const metric = key(spec.group + label);
            parts[metric] = { name: label, group: spec.group, unit: spec.unit };
            row.metrics![metric] = value(values[j]);
          });
        });
      }
    }
    return checked([...rows.values()], 14);
  },
};
export default board;

// ThermoQA ranks systems by the question-weighted composite over three tiers. The dataset card gives three-run means, tier standard deviations and category scores.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const feed = "https://huggingface.co/datasets/olivenet/thermoqa/raw/main/README.md";
const board: Leaderboard = {
  benchmark: 'thermoqa',
  url: "https://huggingface.co/datasets/olivenet/thermoqa#leaderboard-v04",
  feed,
  terms: "Hugging Face allows crawling. The dataset uses CC BY 4.0. https://huggingface.co/datasets/olivenet/thermoqa",
  async fetch() {
    const source = await fetchText(feed);
    const all = markdownTables(source.split('## Leaderboard (v0.4)')[1]?.split('## Key Findings')[0] || '');
    const full = all.find(t => t[0].at(-1) === 'Composite');
    const tiers = all.filter(t => t[0][3] === 'Score' && t[0][4] === 'σ');
    const categories = all.find(t => t[0][0] === 'Category' && t[0][1] === 'Questions');
    if (!full || full.length < 7 || tiers.length !== 3 || !categories) throw new Error('Incomplete ThermoQA tables');
    const short: Record<string,string> = { 'Claude Opus 4.6':'Opus 4.6', 'Gemini 3.1 Pro':'Gemini', 'DeepSeek-R1':'DeepSeek', 'MiniMax M2.5':'MiniMax' };
    board.parts = {};
    return full.slice(1).map(c => {
      const model = c[0], score = num(c.at(-1)), metrics: Record<string, number> = {};
      if (!model || score == null) throw new Error('Missing ThermoQA composite');
      const part = (label: string, value: string) => {
        const n = num(value);
        if (n == null) throw new Error('Missing ' + label);
        board.parts![label] = label;
        metrics[label] = n;
      };
      for (const [i, table] of tiers.entries()) {
        const row = table.find(r => r[1] === model), tier = 'Tier ' + (i + 1);
        if (!row || num(row[4]) == null) throw new Error('Missing ' + tier);
        part(tier, row[3]);
        metrics[tier + 'Std'] = num(row[4])!;
        for (let j = 5; j < table[0].length; j++) part(tier + ': ' + table[0][j], row[j]);
      }
      const index = categories[0].indexOf(short[model] || model);
      for (const row of categories.slice(1)) part('Tier 1: ' + row[0], row[index]);
      return { model, score, trials: 3, metrics };
    });
  },
};
export default board;

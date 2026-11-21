// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// CauGym tests causal inference across five test sets. Table 6 reports two GRPO variants.
// Sections 3.3 to 3.5 give the SFT results. The authors publish all seven task accuracies
// for their main GRPO model on its release card.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.06337';
const card = 'https://huggingface.co/OpenCausaLab/CauGym/raw/main/README.md';
const sets = ['Deconfounding', 'Insufficient', 'Omitted', 'Redundant', 'Rephrased'];
const board: Leaderboard = {
  benchmark: 'caugym', static: 'paper', feed, url: feed,
  headline: 'The paper reports no overall accuracy, so the headline is the plain mean of the five CauGym test-set accuracies.',
  terms: 'The authors publish the paper on arXiv and the GRPO release under Apache 2.0. https://huggingface.co/OpenCausaLab/CauGym',
  parts: Object.fromEntries(sets.map(s => [s, 'CauGym-' + s.toLowerCase()])),
  async fetch() {
    const html = await paperHtml(feed);
    const table = paperTables(html).map(grid).find(t => t[0]?.join('|') === ['Model', 'CaLM', ...sets].join('|'));
    if (!table) throw new Error('Missing Table 6');
    function row(model: string, percentages: number[]): LeaderboardRow {
      if (percentages.length !== 5 || percentages.some(v => !Number.isFinite(v))) throw new Error('Incomplete CauGym results');
      return {model, score: percentages.reduce((a,b) => a+b, 0) / 5, metrics: Object.fromEntries(sets.map((s,i) => [s,percentages[i]]))};
    }
    const rows = table.slice(1).map(c => row(c[0], c.slice(2).map(v => 100 * numberCell(v))));
    const prose = text(html);
    const paired = [...prose.matchAll(/average performance of offline RL methods and SFT reaches only [\d.]+% and ([\d.]+)%/gi)];
    const four = [...prose.matchAll(/average performance of KTO, DPO, SFT, PPO is [\d.]+\s*%, [\d.]+\s*%, ([\d.]+)\s*%/gi)];
    if (paired.length !== 2 || four.length !== 3) throw new Error('Missing SFT results');
    rows.push(row('DeepSeek-R1-Distill-Qwen-14B (SFT)', [four[0], four[2], paired[1], four[1], paired[0]].map(m => numberCell(m[1]))));
    const release = await fetchText(card);
    if (!release.includes('| Benchmark | ATE | CDE | ETT | NDE | NIE | PN | PS |')) throw new Error('Missing GRPO task columns');
    const grpo = sets.map(s => {
      const name = s === 'Omitted' ? 'ommitted' : s.toLowerCase();
      const line = release.split('\n').find(l => l.startsWith('| **CauGym-' + name + '**'));
      const values = line?.split('|').slice(2, -1).map(v => numberCell(v.trim()));
      if (values?.length !== 7) throw new Error('Missing GRPO test set: ' + name);
      return 100 * values.reduce((a,b) => a+b, 0) / 7;
    });
    rows.push(row('CauGym-GRPO-14B', grpo));
    return checked(rows, 4);
  },
};
export default board;

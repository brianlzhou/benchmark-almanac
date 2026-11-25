// OAB-Bench tests written answers to the Brazilian bar exam. The authors' README gives average scores out of ten.
// Read both GPT-5.2 judging formats and the number of exams passed under each format.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/maritaca-ai/oab-bench/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'oab-bench', url: 'https://github.com/maritaca-ai/oab-bench#results', feed,
  stats: { examsPassed: { name: 'Exams passed', unit: 'count', better: 'higher' }, passingRate: { name: 'Passing rate', unit: '%', better: 'higher' } },
  terms: 'Apache License 2.0: https://github.com/maritaca-ai/oab-bench/blob/main/LICENSE.',
  aliases: { 'Qwen3.5-35B': 'qwen3-5-35b-a3b', 'Qwen3.5-397B': 'qwen3-5-397b-a17b' },
  async fetch() {
    const readme = await fetchText(feed);
    if (!readme.includes('GPT-5.2 as judge')) throw new Error('Missing judge identity');
    const tables = markdownTables(readme);
    const scores = tables.find(t => t[0].join('|') === 'Model|Structured|Non-Structured');
    const passes = tables.find(t => t[0].join('|') === '|Structured|Non-Structured' && t[1][0] === 'Passing rate');
    if (!scores || !passes) throw new Error('Missing judge comparison tables');
    return checked(scores.slice(1).flatMap(([model,structured,unstructured]) => {
      const counts = passes.find(r => r[0] === model);
      if (!counts) throw new Error('Missing passing rate for ' + model);
      return [structured,unstructured].map((value,i) => {
        const match = counts[i+1].match(/^(\d+)\/(\d+)$/);
        if (!match || Number(match[2]) !== 42) throw new Error('Unexpected number of exams');
        const examsPassed = Number(match[1]), exams = Number(match[2]);
        return {model, score: numberCell(value), setting: 'GPT-5.2 judge, ' + (i === 0 ? 'structured' : 'non-structured'),
          metrics: { examsPassed, passingRate: 100*examsPassed/exams }};
      });
    }),24);
  },
};
export default board;

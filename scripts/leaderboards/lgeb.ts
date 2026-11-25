// LGEB evaluates summarization and question generation. Its README lists Gigaword ROUGE-1 first.
// SQuAD uses BLEU-4, METEOR and ROUGE-L. Only UniLM has results on both tasks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/CLUEbenchmark/LGEB/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'lgeb', url: 'https://github.com/CLUEbenchmark/LGEB', feed,
  terms: 'The CLUE team publishes the results with attribution to UniLM. https://github.com/CLUEbenchmark/LGEB',
  parts: { gigaword: 'Gigaword ROUGE-1', squad: 'SQuAD BLEU-4' },
  stats: {
    gigawordRouge2: { name: 'Gigaword ROUGE-2', unit: 'score', better: 'higher' },
    gigawordRougeL: { name: 'Gigaword ROUGE-L', unit: 'score', better: 'higher' },
    squadMeteor: { name: 'SQuAD METEOR', unit: 'score', better: 'higher' },
    squadRougeL: { name: 'SQuAD ROUGE-L', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const readme = await fetchText(feed);
    const [summary, questions] = readme.split('### Question Generation');
    if (!summary.includes('ROUGE-1') || !questions?.includes('BLEU-4')) throw new Error('Missing LGEB results');
    function rows(section: string) {
      return section.split('\n').filter(line => line.startsWith('|')).map(line => line.split('|').slice(1,-1)
        .map(v => v.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replaceAll('*','').trim()))
        .filter(r => /^\d/.test(r[1]));
    }
    const q = rows(questions);
    return checked(rows(summary).map(([model, score, rouge2, rougeL]) => {
      const other = q.find(r => r[0] === model);
      const metrics: Record<string, number> = { gigaword: Number(score), gigawordRouge2: Number(rouge2), gigawordRougeL: Number(rougeL) };
      if (other) {
        metrics.squad = Number(other[1]); metrics.squadMeteor = Number(other[2]); metrics.squadRougeL = Number(other[3]);
      }
      return { model, score: metrics.gigaword, metrics };
    }), 2);
  },
};
export default board;

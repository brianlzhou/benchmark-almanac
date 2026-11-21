// MedConceptsQA tests knowledge of medical codes. Its README reports accuracy and confidence
// interval half-widths separately for zero-shot and few-shot evaluation.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = 'https://raw.githubusercontent.com/nadavlab/MedConceptsQA/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'medconceptsqa', url: 'https://github.com/nadavlab/MedConceptsQA#leaderboard', feed,
  terms: 'Public leaderboard tables from the authors’ project README.',
  aliases: { 'gpt-4-0125-preview': 'gpt-4-turbo-jan-2024' },
  async fetch() {
    const body = (await fetchText(feed)).split('## Leaderboard:')[1];
    if (!body) throw new Error('MedConceptsQA leaderboard missing');
    return ['Zero-shot','Few-shot'].flatMap(setting => {
      const section = body.split('*' + setting + '*:')[1] ?? '';
      const table = markdownTables(section)[0];
      if (table?.[0].join('|') !== 'Model Name|Accuracy|CI' || table.length < 20) throw new Error('Incomplete MedConceptsQA ' + setting);
      return table.slice(1).map(([model, acc, ci]) => {
        const score = Number(acc), width = Number(ci);
        if (!model || !acc || !ci || ![score,width].every(Number.isFinite)) throw new Error('Invalid MedConceptsQA row');
        return { model, setting, score, low: score - width, high: score + width };
      });
    });
  },
};
export default board;

// OncoTriad-QA evaluates multimodal cancer case questions. Table 1 reports mean accuracy for universal MCQs first,
// followed by case-specific MCQ accuracy and open-ended BERT-F1 and ROUGE-L. Each result summarizes three runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.02615';
const board: Leaderboard = {
  benchmark: 'oncotriad-qa', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2608.02615.',
  headline: 'The paper reports separate metrics for its three task families, so the headline is mean universal MCQ accuracy, the first family in Table 1.',
  parts: {},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'Name|GPT-5.4|MedGemma|Gemma-4|OncoVLM|OncoVLM');
    if (!table || table[1]?.slice(2).join('|') !== '4B|E4B|Qwen-3.5-9B|Qwen-3.5-9B') throw new Error('Missing OncoTriad-QA models');
    const names = ['GPT-5.4','MedGemma 4B','Gemma-4 E4B','OncoVLM','OncoVLM'];
    const groups = ['Universal MCQ','Case-specific MCQ','Case specific open-ended'];
    const rows: LeaderboardRow[] = names.map((model, i) => {
      const metrics: Record<string,number> = {};
      let group = -1, score = NaN;
      for (const r of table.slice(4)) {
        if (r[0] === r[1]) {
          group = groups.findIndex(g => r[0].startsWith(g));
          if (group === -1) throw new Error('Unknown task family');
          continue;
        }
        const m = r[i+1].match(/^([\d.]+) \/ ([\d.]+) \\pm ([\d.]+) \/ \\pm ([\d.]+)$/);
        if (!m) throw new Error('Missing scores or deviations for ' + r[0]);
        const key = ['universal','case','open'][group] + r[0].replace(/[^A-Za-z]/g,'');
        const [first,second,sd1,sd2] = m.slice(1).map(numberCell);
        board.parts![key] = {name: r[0], group: groups[group], unit: group === 2 ? 'score' : '%'};
        metrics[key] = first;
        metrics[key + 'Std'] = sd1;
        const secondary = key + (group === 2 ? 'RougeL' : 'MacroF1');
        metrics[secondary] = second;
        metrics[secondary + 'Std'] = sd2;
        if (group === 0 && r[0] === 'Mean') {score = first; metrics.std = sd1;}
      }
      const setting = i === 3 ? 'Projector only' : i === 4 ? 'Fine-tuned' : 'All available modalities';
      return {model, setting, score, metrics, trials: 3};
    });
    return checked(rows, 5);
  },
};
export default board;

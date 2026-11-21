// RuMedBench tests Russian medical language understanding. The authors' README gives Overall and five task results.
// Overall averages the task scores after averaging the two metrics within each task that has them.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/sberbank-ai-lab/RuMedBench';
const feed = 'https://raw.githubusercontent.com/sberbank-ai-lab/RuMedBench/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'rumedbench', url, feed,
  terms: 'GitHub hosts the authors’ public results under its terms. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  parts: { top3: 'RuMedTop3 accuracy', top3Hit: 'RuMedTop3 Hit@3',
    symptom: 'RuMedSymptomRec accuracy', symptomHit: 'RuMedSymptomRec Hit@3',
    daNet: 'RuMedDaNet accuracy', nli: 'RuMedNLI accuracy', ner: 'RuMedNER accuracy', nerF1: 'RuMedNER F1' },
  async fetch() {
    const section = (await fetchText(feed)).split('Test results:')[1]?.split('We define the overall')[0];
    const grid = section?.split('\n').filter(line => line.trim().startsWith('|'))
      .map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim()));
    if (grid?.[0]?.join('|') !== 'Model|RuMedTop3|RuMedSymptomRec|RuMedDaNet|RuMedNLI|RuMedNER|Overall') {
      throw new Error('Missing RuMedBench test results');
    }
    const rows = grid.slice(2).filter(([model]) => model !== 'Human' && model !== 'Naive').map(([model, ...cells]) => {
      const values = cells.flatMap(cell => cell.split('/').map(s => s.trim()));
      if (values.length !== 9 || !values.every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid RuMedBench metrics');
      const [top3, top3Hit, symptom, symptomHit, daNet, nli, ner, nerF1, score] = values.map(Number);
      const models = model === 'Feature-based' ? ['Logistic regression', 'Conditional random fields'] : undefined;
      return { model, models, score, metrics: { top3, top3Hit, symptom, symptomHit, daNet, nli, ner, nerF1 } };
    });
    return checked(rows, 4);
  },
};
export default board;

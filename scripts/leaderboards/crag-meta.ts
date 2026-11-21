// CRAG tests factual question answering with or without retrieval. Tables 6 and 11 report
// overall truthfulness. Divide their percentage-scaled values by 100 for the signed score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.04744';
const board: Leaderboard = {
  benchmark: 'crag-meta', url: feed, feed, static: 'paper',
  terms: 'The authors distribute the paper under the arXiv perpetual non-exclusive license. https://arxiv.org/licenses/nonexclusive-distrib/1.0/',
  stats: {accuracy:{name:'Answer accuracy',unit:'%',better:'higher'},hallucination:{name:'Hallucination rate',unit:'%',better:'lower'},missing:{name:'Missing answer rate',unit:'%',better:'lower'},perfect:{name:'Perfect answer rate',unit:'%',better:'higher'},acceptable:{name:'Acceptable answer rate',unit:'%',better:'higher'},latency:{name:'Latency',unit:'seconds',better:'lower'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const automatic = tables.find(t => t[0]?.join('|') === '|Model|Accuracy (%)|Hallucination (%)|Missing (%)|Truthfulness (%)');
    const human = tables.find(t => t[0]?.join('|') === '|System|Perfect|Acc.|Hall.|Miss.|Truth h|Latency (ms)');
    if (!automatic || !human) throw new Error('Missing CRAG truthfulness columns');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const [task, name, accuracy, hallucination, missing, truth] of automatic.slice(1)) {
      if (task) setting = task;
      const model = name === 'GPT-4 Turbo' ? 'GPT-4 Turbo (gpt-4-turbo-2024-04-09)' : name;
      rows.push({model, setting: 'Automatic evaluation: ' + setting, trials: 1335, score: numberCell(truth) / 100,
        metrics: {accuracy: numberCell(accuracy), hallucination: numberCell(hallucination), missing: numberCell(missing)}});
    }
    for (const [weight, model, perfect, acceptable, hallucination, missing, truth, latency] of human.slice(1)) {
      if (weight === 'Equal' || weight === 'Traffic') setting = weight + ' weighting';
      const metrics: Record<string, number> = {perfect: numberCell(perfect), acceptable: numberCell(acceptable),
        hallucination: numberCell(hallucination), missing: numberCell(missing)};
      if (latency !== '-') metrics.latency = numberCell(latency.replaceAll(',', '')) / 1000;
      rows.push({model, setting: 'Human evaluation: ' + setting, trials: 1335, metrics, score: numberCell(truth) / 100});
    }
    return checked(rows, 42);
  },
};
export default board;

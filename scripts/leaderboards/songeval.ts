// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// SongEval tests predictions of expert song ratings. Table 3 lists utterance-level mean squared error first. Lower is better.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.10793';
const dimensions = ['Coherence', 'Memorability', 'Naturalness', 'Clarity', 'Musicality'];
const measures = ['MSE', 'LCC', 'SRCC', 'KATU'];
const board: Leaderboard = {
  benchmark: 'songeval', url: feed, feed, static: 'paper',
  terms: 'SongEval uses CC BY-NC-SA 4.0. https://github.com/ASLP-lab/SongEval#-license',
  headline: 'The paper gives no overall score. This is the mean utterance-level squared error across five rating dimensions. Lower is better.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[2] === 'Utterance-level' && t[0]?.[6] === 'System-level');
    if (!table || !table[1].slice(2).every((v,i) => v.startsWith(measures[i % 4])) || table[1].length !== 10) throw new Error('SongEval Table 3 changed');
    const models = new Map<string, Record<string, number>>();
    const parts: Record<string, BoardPart> = {};
    for (const [dimension, model, ...values] of table.slice(2)) {
      if (!dimensions.includes(dimension) || values.length !== 8) throw new Error('Unexpected SongEval dimension or metric');
      const metrics = models.get(model) ?? {};
      values.forEach((v, i) => {
        const level = i < 4 ? 'Utterance' : 'System';
        const measure = measures[i % 4];
        const key = dimension + level + measure;
        metrics[key] = numberCell(v);
        parts[key] = { name: dimension + ': ' + level + '-level ' + measure, better: measure === 'MSE' ? 'lower' : 'higher', unit: 'score' };
      });
      models.set(model, metrics);
    }
    board.parts = parts;
    const rows = [...models].filter(([, m]) => dimensions.every(d => Number.isFinite(m[d + 'UtteranceMSE']))).map(([model, metrics]) => ({
      model, metrics, score: dimensions.reduce((sum, d) => sum + metrics[d + 'UtteranceMSE'], 0) / dimensions.length,
    }));
    return checked(rows, 4);
  },
};
export default board;

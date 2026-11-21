// EvaOmni ranks audio-video models by overall accuracy. The page loads accuracy and two grounding measures for each level from data.js.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const url = "https://xiaoxing2001.github.io/EvaOmni.github.io/#leaderboard";
const feed = "https://xiaoxing2001.github.io/EvaOmni.github.io/data.js";

const board: Leaderboard = {
  benchmark: 'evaomni', url, feed,
  terms: "The repository code uses the MIT License. The dataset has separate terms for annotations and media. https://github.com/VisionXLab/EvaOmni" ,
  aliases: {
    'Qwen3-Omni-Instruct-30B-A3B': 'qwen3-omni-30b-a3b',
    'MiMo-V2.5-310B-A15B': 'mimo-v2-5',
    'MiMo-V2.6-Flash-310B-A15B': 'mimo-v2-6-flash',
    'MiMo-V2.6-Pro-1T-A42B': 'mimo-v2-6-pro',
  },
  parts: { l1: 'Level 1 · Retrieval & grounding', l2: 'Level 2 · Basic understanding', l3: 'Level 3 · Complex reasoning' },
  async fetch() {
    const data = jsonAfter<{models: {name: string; type: string; scores: Record<string, number[]>}[]}>(await fetchText(feed), 'window.EVAOMNI =');
    const models = data.models.filter(m => m.type !== 'human');
    if (models.length < 24) throw new Error('Incomplete EvaOmni model list');
    return models.map(m => {
      const metrics: Record<string, number> = {};
      for (const level of ['overall', 'l1', 'l2', 'l3']) {
        const values = m.scores[level];
        if (!m.name || values?.length !== 3 || !values.every(Number.isFinite)) throw new Error('Incomplete scores for ' + m.name);
        if (level !== 'overall') metrics[level] = values[0];
        metrics[level + 'CG'] = values[1];
        metrics[level + 'BG'] = values[2];
      }
      return { model: m.name, open: m.type === 'open', score: m.scores.overall[0], metrics };
    });
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// ltzGLUE tests Luxembourgish language understanding. Table 6 reports test F1
// for each task and standard deviation over three training runs for encoders.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2604.17976';
const parts = {HA: 'Headline acceptability', SA: 'Sentiment analysis', LAB: 'Binary linguistic acceptability',
  LAM: 'Multiclass linguistic acceptability', NER: 'Named entity recognition', TC: 'Topic classification',
  ID: 'Intent detection', RTE: 'Textual entailment'};
const keys = Object.keys(parts);
export default {
  benchmark: 'ltzglue', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2604.17976',
  headline: 'The paper reports no overall F1, so the headline is the plain mean of the eight test F1 scores.',
  parts: Object.fromEntries(Object.entries(parts).map(([key,name]) => [key,{name,unit: 'score' as const}])),
  aliases: {GPT: 'gpt-5-mini', Gemma: 'gemma-3-27b', Llama: 'llama-3-3-70b', Qwen: 'qwen3-235b-a22b'},
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === ['Model', ...keys].join('|'));
    if (!t) throw new Error('Missing test F1 table');
    return checked(t.slice(1).map(([model, ...cells]) => {
      if (cells.length !== keys.length) throw new Error('Incomplete model');
      const metrics: Record<string, number> = {};
      const zeroShot = ['GPT','Gemma','Llama','Qwen'].includes(model);
      cells.forEach((cell, i) => {
        const m = cell.match(/^(\d+\.\d+)(?: \\pm(\d+\.\d+))?$/);
        if (!m || Boolean(m[2]) === zeroShot) throw new Error('Invalid task F1: ' + cell);
        metrics[keys[i]] = Number(m[1]);
        if (m[2]) metrics[keys[i] + 'Std'] = Number(m[2]);
      });
      return {model, setting: zeroShot ? 'Zero-shot' : 'Supervised fine-tuning', trials: zeroShot ? 1 : 3,
        score: keys.reduce((sum, key) => sum + metrics[key], 0) / keys.length, metrics};
    }), 10);
  },
} satisfies Leaderboard;

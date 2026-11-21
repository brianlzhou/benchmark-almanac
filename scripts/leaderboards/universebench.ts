// UniVerseBench asks multiple-choice questions about multilingual folk music.
// The museum's Overall Results table reads accuracy on 5,042 questions from exhibits.json.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'http://143.89.224.8:8790/';
const feed = url + 'data/exhibits.json';
const parts = { zh: 'Chinese', ko: 'Korean', other: 'Other languages', fe: 'Feature Extraction',
  cr: 'Causal Reasoning', pr: 'Music Pattern Recognition', ca: 'Comparison Analysis', ed: 'Error Detection' };
const board: Leaderboard = {
  benchmark: 'universebench', url, feed, parts,
  terms: 'The authors license UniVerseBench under CC BY-NC 4.0. https://huggingface.co/datasets/universe-team/universebench',
  aliases: { 'Qwen2.5-Omni-7B-Instruct': 'qwen2-5-omni-7b' },
  async fetch() {
    const { results } = await fetchJson<{ results: ({ model: string; overall: number } & Record<keyof typeof parts, number>)[] }>(feed);
    const rows = results.map(row => {
      if (!row.model || !Number.isFinite(row.overall)) throw Error('Missing UniVerseBench overall accuracy');
      const metrics = Object.fromEntries((Object.keys(parts) as (keyof typeof parts)[]).map(key => {
        if (!Number.isFinite(row[key])) throw Error('Missing ' + key + ' accuracy for ' + row.model);
        return [key, row[key]];
      }));
      return { model: row.model, score: row.overall, metrics };
    });
    return checked(rows, 9);
  },
};
export default board;

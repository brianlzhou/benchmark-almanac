// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// ANCHOR evaluates video answers, hallucination, reasoning divergence and conciseness. All four scores run from 1 to 5.
// The project's results table supplies all four main-evaluation scores plus response length in tokens.
import type { Leaderboard } from './types.ts';
import { jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://anchorbenchmark.github.io/app.js';
type Row = [string, number, number, number, number, number];
const board: Leaderboard = {
  benchmark: 'anchor', url: 'https://anchorbenchmark.github.io/#findings', feed,
  terms: 'CC BY-NC-ND 4.0. https://github.com/anchorbenchmark/ANCHORBenchmark/blob/main/LICENSE.txt',
  aliases: { 'Nemotron-3-Nano-Omni-30B': 'nemotron-3-nano-omni-30b-a3b' },
  headline: 'The authors report four separate scores from 1 to 5. The headline is their plain mean on the main evaluation.',
  parts: { answer: 'Answer', hallucination: 'Hallucination', divergence: 'Divergence', conciseness: 'Conciseness' },
  stats: {
    outputTokens: { name: 'Output tokens', unit: 'tokens' },
    humanAnswer: { name: 'Human subset answer score', unit: 'score', better: 'higher', note: 'Answer score on the human-evaluated subset, from 1 to 5.' },
    humanHallucination: { name: 'Human subset hallucination score', unit: 'score', better: 'higher', note: 'Hallucination score on the human-evaluated subset, from 1 to 5.' },
    humanConciseness: { name: 'Human subset conciseness score', unit: 'score', better: 'higher', note: 'Conciseness score on the human-evaluated subset, from 1 to 5.' },
    humanDivergence: { name: 'Human subset divergence score', unit: 'score', better: 'higher', note: 'Reasoning divergence score on the human-evaluated subset, from 1 to 5.' },
    humanOutputTokens: { name: 'Human subset output tokens', unit: 'tokens' },
  },
  async fetch() {
    const script = await fetchText(feed);
    if (!/cols\s*=\s*\[1,2,5,3,4\]/.test(script)) throw new Error('Changed displayed column order');
    const data = script.slice(script.indexOf('const results=')).split('function showResults')[0].replace(/'([^'\\]*)'/g, (_, s: string) => JSON.stringify(s));
    function read(split: string) {
      const i = data.indexOf(split + ':[');
      if (i < 0) throw new Error('Missing results for ' + split);
      const rows = jsonAt<Row[]>(data, i + split.length + 1);
      if (rows.some(r => r.length !== 6 || !r[0] || !r.slice(1).every(Number.isFinite))) throw new Error('Invalid ANCHOR row');
      return rows;
    }
    const human = new Map(read('human').map(([model, ...v]) => [model, v]));
    return checked(read('main').map(([model, answer, hallucination, conciseness, tokens, divergence]) => {
      const metrics: Record<string, number> = { answer, hallucination, divergence, conciseness, outputTokens: tokens };
      const sub = human.get(model);
      if (sub) ['humanAnswer', 'humanHallucination', 'humanConciseness', 'humanOutputTokens', 'humanDivergence'].forEach((key, i) => { metrics[key] = sub[i]; });
      return { model, score: (answer + hallucination + divergence + conciseness) / 4, setting: 'Truncated-video input', tokens, metrics };
    }), 12);
  },
};
export default board;

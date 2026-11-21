// MathTutorBench measures three teaching skills with several tasks and scoring rules.
// Its leaderboard defaults to problem-solving accuracy. The other columns include BLEU, F1 and pedagogical win rates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://eth-lre.github.io/mathtutorbench/';
const labels = ['Problem Solving', 'Socratic Questioning', 'Solution Correctness', 'Mistake Location', 'Mistake Correction',
  'Scaffolding Win Rate', 'Pedagogy IF Win Rate', 'Scaffolding (Hard)', 'Pedagogy IF (Hard)'];
const board: Leaderboard = {
  benchmark: 'mathtutorbench', url, feed: url,
  terms: 'The research team publishes the model results on the project site. https://eth-lre.github.io/mathtutorbench/',
  aliases: { 'LLaMA3.2-3B-Instruct': 'llama-3-2-3b', 'LLaMA3.1-8B-Instruct': 'llama-3-1-8b',
    'LLaMA3.1-70B-Instruct': 'llama-3-1-70b', 'Qwen/Qwen2.5-7B-Instruct': 'qwen2-5-7b' },
  parts: Object.fromEntries(labels.map((name, i) => ['task' + (i+1), { name, note: i === 1 ? 'BLEU' : 'Score from 0 to 1' }])),
  async fetch() {
    const html = await fetchText(url);
    const table = tables(html).find(t => t[0]?.[0]?.text === 'Model');
    if (!table || table[0].slice(1).map(c => c.text.replace(/[▼▲]/g, '').trim()).join() !== labels.join())
      throw new Error('MathTutorBench task headers changed');
    const block = html.match(/const MODELS = (\[[\s\S]*?\n\s*\]);/)?.[1];
    if (!block) throw new Error('Missing model data');
    const models = jsLiteral<{ name: string, scores: number[] }[]>(block.replace(/'([^'\\]*)'/g, (_, s: string) => JSON.stringify(s)), 0);
    const rows = models.map(({ name, scores }) => {
      if (scores.length !== labels.length || !scores.every(s => Number.isFinite(s) && s >= 0 && s <= 1)) throw new Error('Invalid scores');
      const model = name.split(' (')[0];
      return { model, setting: name.includes('adaptive reasoning') ? 'Adaptive reasoning' : 'Reasoning disabled', score: scores[0],
        metrics: Object.fromEntries(scores.map((s, i) => ['task' + (i+1), s])) };
    });
    checked(rows.map(row => ({ ...row })), 17);
    return rows;
  },
};
export default board;

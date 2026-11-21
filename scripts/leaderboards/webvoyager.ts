import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2401.13919';
const board: Leaderboard = {
  benchmark: 'webvoyager', static: 'paper', parts: {
  Allrecipes: { name: 'Allrecipes', group: 'Environment' },
  Amazon: { name: 'Amazon', group: 'Environment' },
  Apple: { name: 'Apple', group: 'Environment' },
  ArXiv: { name: 'arXiv', group: 'Environment' },
  GitHub: { name: 'GitHub', group: 'Environment' },
  Booking: { name: 'Booking', group: 'Environment' },
  ESPN: { name: 'ESPN', group: 'Environment' },
  Coursera: { name: 'Coursera', group: 'Environment' },
  'Cambridge Dictionary': { name: 'Cambridge Dictionary', group: 'Environment' },
  'BBC News': { name: 'BBC News', group: 'Environment' },
  'Google Flights': { name: 'Google Flights', group: 'Environment' },
  'Google Map': { name: 'Google Map', group: 'Environment' },
  'Google Search': { name: 'Google Search', group: 'Environment' },
  Huggingface: { name: 'Hugging Face', group: 'Environment' },
  'Wolfram Alpha': { name: 'Wolfram Alpha', group: 'Environment' },
}, url: URL, feed: URL + ' (GPT-4V-judged overall success rate)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[1] === 'Allrecipes');
    if (!t) throw new Error('WebVoyager result table missing');
    const split = t.findIndex(r => r.at(-1) === 'Overall');
    const selected = t.slice(split + 2).filter(r => r[0].includes('∗') && !r[0].includes('Text-only'));
    if (selected.length !== 3) throw new Error('WebVoyager backbone rows changed');
    return selected.map(r => {
      const metrics: Record<string, number> = {judgeRuns: 3, std: parseFloat(r[8].split('±')[1])};
      const first = t.slice(1, split).find(x => x[0] === r[0])!;
      for (let i = 1; i < 9; i++) metrics[t[0][i]] = parseFloat(first[i]);
      for (let i = 1; i < 8; i++) metrics[[t[split][i],t[split + 1][i]].filter((s,j,a)=>a.indexOf(s)===j).join(' ')] = parseFloat(r[i]);
      return {model: r[0].includes('Claude') ? 'Claude 3 Opus' : r[0].includes('GPT-4o') ? 'GPT-4o (snapshot unspecified)' : 'gpt-4-vision-preview',
        score: parseFloat(r[8]), harness: 'WebVoyager', setting: 'screenshots; temperature 1; max 15 steps; GPT-4V evaluator', metrics};
    });
  },
};
export default board;

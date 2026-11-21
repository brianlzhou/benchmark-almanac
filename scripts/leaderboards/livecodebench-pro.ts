import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2506.11928';
const number = (s: string) => parseFloat(s.replace(/[$\s,]/g, ''));
const snapshots: Record<string, string> = {'GPT-4o': 'gpt-4o-2024-11-20', 'Gemini 2.5 Pro': 'gemini-2.5-pro-exp-03-25', 'Gemini 2.5 Flash': 'gemini-2.5-flash-preview-04-17', 'DeepSeek V3 0324': 'DeepSeek-V3-0324', 'GPT-4.5': 'GPT-4.5 Preview'};
const board: Leaderboard = {
  benchmark: 'livecodebench-pro', static: 'paper', parts: {
  hard: { name: 'Hard', group: 'Difficulty' },
  medium: { name: 'Medium', group: 'Difficulty' },
  easy: { name: 'Easy', group: 'Difficulty' },
}, url: URL, feed: URL + ' (paper Elo rating)', terms: PAPER_TERMS,
  aliases: {'gemini-2.5-pro-exp-03-25': 'gemini-2-5-pro-mar-2025', 'gemini-2.5-flash-preview-04-17': 'gemini-2-5-flash-apr-2025'},
  async fetch() {
    const ts = inlinePaperTables(await paperHtml(URL));
    const t = ts.find(t => t[0]?.[4] === 'Rating');
    if (!t) throw new Error('LiveCodeBench Pro table missing');
    let cohort = '';
    return t.slice(1).flatMap(r => {
      if (r[0].endsWith('Models')) {cohort = r[0]; return [];}
      const raw = r[0].replace(/ \((?:Max|No) Reasoning\)$/, '').replace(/-high$/, '');
      const setting = /Max Reasoning/.test(r[0]) ? 'max reasoning' : /No Reasoning/.test(r[0]) ? 'reasoning disabled' : /-high$/.test(r[0]) ? 'high reasoning' : cohort;
      return [{model: snapshots[r[0]] ?? paperModel(raw), score: number(r[4]), setting,
        cost: number(r[7]), tokens: number(r[6]), metrics: {hard: number(r[1]), medium: number(r[2]), easy: number(r[3]), percentile: number(r[5]), outputTokens: number(r[6])}}];
    });
  },
};
export default board;

// LinguaSafe measures vulnerability to multilingual safety prompts. Tables 3 and 4 publish language and domain scores and the overall average.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2508.12733';

const board: Leaderboard = {
  benchmark: 'linguasafe', static: 'paper',
  url: 'https://arxiv.org/abs/2508.12733',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"GPT-4o": "gpt-4o-nov-2024", "Claude-3.5-Sonnet": "claude-3-5-sonnet-october-2024", "Llama-3.1-8B-Instruct": "llama-3-1-8b", "Gemma-2-27B-IT": "gemma-2-27b"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const domains = tables.find(t => t[0]?.[1] === 'Crimes & Illegal Activities' && t[0]?.[6] === 'Average');
    const languages = tables.find(t => t[0]?.join('|') === 'Model|en|zh|ar|ru|sr|th|ko|vi|cs|hu|bn|ms');
    if (!domains || !languages || domains.length < 10 || domains.length !== languages.length) throw new Error('Missing LinguaSafe results');
    const keys = ['crimes','harm','fairness','privacy','explicit', ...languages[0].slice(1)];
    const labels = [...domains[0].slice(1,-1), ...languages[0].slice(1)];
    board.parts = Object.fromEntries(keys.map((k, i) => [k, labels[i]]));
    return domains.slice(1).map(c => {
      const other = languages.find(r => r[0] === c[0]);
      if (!other) throw new Error('Missing language breakdown for ' + c[0]);
      const values = [...c.slice(1,-1), ...other.slice(1)];
      if (values.length !== keys.length || [...values, c[6]].some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid LinguaSafe scores');
      return { model: c[0], score: Number(c[6]), metrics: Object.fromEntries(keys.map((k, i) => [k, Number(values[i])])) };
    });
  },
};
export default board;

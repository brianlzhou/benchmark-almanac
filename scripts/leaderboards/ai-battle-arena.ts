// AI Battle Arena ranks models by their mean placement across strategic games, scaled to 100.
// Read the leaderboard's sorting values and the game results printed below it.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://aibattlearena.com/leaderboard.html";
const feed = url;

const board: Leaderboard = {
  benchmark: 'ai-battle-arena', url, feed,
  terms: "The project repository uses the MIT License. The site's robots.txt URL returns HTML.",
  parts: {},
  stats: { arenaElo: { name: 'Arena Elo', unit: 'elo', better: 'higher' }, holdem_tournament: { name: 'Holdem tournament Elo', unit: 'elo', better: 'higher' }, match_tournament: { name: 'Match tournament Elo', unit: 'elo', better: 'higher' }, blackjack: { name: 'Blackjack score', unit: 'score', better: 'higher' }, leduc: { name: 'Leduc Elo', unit: 'elo', better: 'higher' }, blotto: { name: 'Blotto Elo', unit: 'elo', better: 'higher' }, connect4: { name: 'Connect Four Elo', unit: 'elo', better: 'higher' }, gomoku: { name: 'Gomoku Elo', unit: 'elo', better: 'higher' } },
  async fetch() {
    const page = await fetchText(feed);
    const rows = [...page.matchAll(/<tr data-score='([\d.]+)' data-elo='([\d.]+)'>([\s\S]*?)<\/tr>/g)].map(m => {
      const model = text(m[3].match(/<td class='model'>([\s\S]*?)<\/td>/)?.[1] ?? '');
      if (!model) throw new Error('Arena row missing model');
      return { model, score: Number(m[1]), metrics: { arenaElo: Number(m[2]) } as Record<string, number> };
    });
    if (rows.length < 11) throw new Error('Incomplete arena ranking');
    for (const card of page.matchAll(/<a class="card" href="(\w+)_report.html">([\s\S]*?)<\/a>/g)) {
      const key = card[1];
      const name = text(card[2].match(/class="ctitle">([^<]+)/)?.[1] ?? '').replace(/^\S+\s+/, '');
      if (!name) throw new Error('Arena game missing title');
      board.parts![key] = { name, unit: key === 'blackjack' ? 'score' : 'elo', ...(key === 'blackjack' ? { note: 'Mean chips per hand.' } : {}) };
      for (const cell of card[2].matchAll(/class='mr-nm'>(.*?)<\/span>.*?class='mr-val'>([^<]+)</g)) {
        const row = rows.find(r => r.model === text(cell[1]));
        const score = Number(cell[2].replace('−', '-'));
        if (!Number.isFinite(score)) throw new Error('Invalid game score');
        if (row) row.metrics[key] = score;
      }
    }
    if (Object.keys(board.parts!).length < 7) throw new Error('Missing arena game rankings');
    return rows;
  },
};
export default board;

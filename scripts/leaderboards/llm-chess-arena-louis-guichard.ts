// Louis Guichard ranks chess models by Elo after completed games. The standings give game counts, outcome percentages, seconds per move and cost per game in euros.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const feed = "https://chess.louisguichard.fr/leaderboard";
const board: Leaderboard = {
  benchmark: 'llm-chess-arena-louis-guichard',
  url: "https://chess.louisguichard.fr/leaderboard",
  feed,
  terms: "The robots file includes content signals. The repository uses the MIT license. The scoreboard gives no separate terms for its scores. https://github.com/louisguichard/llm-chess-arena/blob/main/LICENSE.txt",
  aliases: { 'Qwen3 30B': 'qwen3-30b-a3b' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === '#|Player|ELO|Games|W/D/L|Time/Move|Cost/Game');
    if (!table || table.length < 48) throw new Error('Missing chess standings');
    return table.slice(1).map(cells => {
      const model = text(cells[1].html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1] || '');
      const score = num(cells[2].text), trials = num(cells[3].text);
      const rates = [...cells[4].text.matchAll(/([\d.]+)%/g)].map(m => Number(m[1]));
      const seconds = num(cells[5].text), euros = num(cells[6].text);
      if (!model || score == null || !trials || rates.length !== 3) throw new Error('Incomplete chess standings');
      const metrics: Record<string, number> = { wins: rates[0], draws: rates[1], losses: rates[2] };
      if (seconds != null) metrics.secondsPerMove = seconds;
      if (euros != null && cells[6].text.includes('€')) metrics.eurosPerGame = euros;
      return { model, score, trials, metrics };
    });
  },
};
export default board;

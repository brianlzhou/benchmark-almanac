// MageBench ranks Magic agents by their combined regular-season rating. Read the Season 2
// ranking table, preserving format ratings, game counts, win rates and API cost per game.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://mage-bench.com/season/2/rankings";
const board: Leaderboard = {
  benchmark: 'mage-bench',
  url: "https://mage-bench.com/season/2/rankings",
  feed,
  terms: "The host serves HTML for robots.txt. MageBench licenses its code and data under MIT.",
  stats: { games:{name:'Games played',unit:'count'}, winRate:{name:'Win rate',unit:'%',better:'higher'}, blunderIndex:{name:'Blunder index',unit:'score',better:'lower'} },
  aliases: { "Qwen3 235B": "qwen3-235b-a22b-instruct-jul-2025" },

  async fetch() {
    const page = await fetchText(feed), rows = new Map<string, LeaderboardRow>();
    for (const body of page.matchAll(/<tbody[^>]*data-format="([^"]+)"[^>]*>([\s\S]*?)<\/tbody>/g)) {
      const format = body[1];
      for (const line of body[2].matchAll(/<tr([^>]+)>([\s\S]*?)<\/tr>/g)) {
        const fields = Object.fromEntries([...line[1].matchAll(/data-([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
        const key = fields['model-id'] + '|' + fields['reasoning-effort'];
        const label = text(line[2].match(/<td class="model-name">([\s\S]*?)<\/td>/)?.[1] ?? '');
        if (!label || !fields.rating || !Number.isFinite(Number(fields.rating))) throw new Error('Invalid MageBench rating');
        if (format === 'combined') {
          const link = line[2].match(/class="games-link" href="([^"]+)"/)?.[1];
          rows.set(key, { model: label.replace(/ \([^()]+\)$/, ''), setting: fields['reasoning-effort'] || undefined,
            score: Number(fields.rating), cost: Number(fields['avg-api-cost']), link: link ? new URL(link.replaceAll('&amp;', '&'), feed).href : undefined,
            metrics: { games: Number(fields['games-played']), winRate: Number(fields['win-rate']) * 100, blunderIndex: Number(fields['blunder-score']) } });
        } else if (rows.has(key)) {
          (board.parts ??= {})[format] = format[0].toUpperCase() + format.slice(1);
          rows.get(key)!.metrics![format] = Number(fields.rating);
        }
      }
    }
    if (rows.size < 11) throw new Error('Incomplete combined MageBench rankings');
    return [...rows.values()];
  },
};
export default board;

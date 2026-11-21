// Ramp Labs pits language models against each other in Connect Four. The results page prints
// the final Elo ratings and each model's tournament points and game count in a crosstable.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://labs.ramp.com/llm-games/";
const board: Leaderboard = {
  benchmark: 'llm-games-ramp',
  url: "https://labs.ramp.com/llm-games/",
  feed,
  terms: "The host returns HTML for robots.txt. Ramp Labs links its terms and gives no separate data reuse license.",
  stats:{points:{name:'Tournament points',unit:'score',better:'higher'},games:{name:'Games played',unit:'count'}},
  aliases: { Gemini25Flash: 'gemini-2-5-flash-jun-2025', Gemini25Pro: 'gemini-2-5-pro-jun-2025' },
  async fetch() {
    const html = await fetchText(feed);
    const block = html.match(/Crosstable \(score \/ games[^<]*?Final Elo Ratings:([\s\S]*?)<\/pre>/);
    if (!block) throw new Error('Missing Ramp Connect Four results');
    const rows: LeaderboardRow[] = [];
    for (const m of block[1].matchAll(/^\s*([\w.-]+):\s*([\d.]+)\s*$/gm)) {
      const label = m[1], cross = label === 'GPT-5' ? 'gpt-5-medium' : label;
      const line = block[0].split('\n').find(l => l.split('|')[0].trim().toLowerCase() === cross.toLowerCase());
      const points = line?.match(/\|\s*([\d.]+)\s*\/\s*(\d+)\s*$/);
      if (!points) throw new Error('Missing crosstable result for ' + label);
      rows.push({ model: label.startsWith('GPT-5') ? 'GPT-5' : label, setting: label === 'GPT-5-high' ? 'high' : label === 'GPT-5' ? 'medium' : undefined,
        score: Number(m[2]), metrics: { points: Number(points[1]), games: Number(points[2]) } });
    }
    if (rows.length < 9) throw new Error('Missing final Elo ratings');
    return rows;
  },
};
export default board;

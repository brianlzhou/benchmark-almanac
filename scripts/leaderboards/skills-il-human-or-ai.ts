// Skills IL asks readers whether a Hebrew text was written by a person. Its leaderboard reports the human-guess rate and interval beside an independent factual accuracy result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, nextFlight, jsonAfter } from '../lib/html.ts';

const feed = "https://agentskills.co.il/en/leaderboard";

const board: Leaderboard = {
  benchmark: "skills-il-human-or-ai",
  url: "https://agentskills.co.il/en/leaderboard",
  feed,
  terms: "Read the Passes as human column. The factual results export omits this measure. The organizers offer a download. Site terms restrict copying, automated collection and commercial use. The MIT license applies to individual skills. https://agentskills.co.il/en/terms The site's robots.txt disallows named AI crawlers.",
  stats: { saidHuman: { name: 'Said human', unit: 'count' } },
  async fetch() {
    const html = await fetchText(feed), flight = nextFlight(html);
    const stats = jsonAfter<{ author: string; guesses: number; saidHuman: number }[]>(flight.slice(flight.indexOf('"stats":[{"author"')), '"stats":');
    const t = tables(html).find(t => t[0]?.at(-1)?.text.includes('Passes as human'));
    if (!t || t.length < 15) throw new Error('Missing human-guess results');
    return t.slice(1).map(r => {
      const model = r[1].text.replace(/\s*Open weights$/, '');
      const item = [...flight.matchAll(/"modelId":"([^"]+)","label":"([^"]+)","open":(true|false)/g)].find(m => m[2] === model);
      const votes = stats.find(s => s.author === item?.[1]);
      const interval = r.at(-1)!.text.match(/([\d.]+)% of guesses said a person wrote it \(likely range ([\d.]+)%-([\d.]+)%\)/);
      if (!votes || !votes.guesses || !interval) throw new Error('Missing votes or interval for ' + model);
      const score = 100 * votes.saidHuman / votes.guesses;
      if (Math.abs(score - Number(interval[1])) > 0.51) throw new Error('Inconsistent guess rate');
      return { model, score, open: item![3] === 'true', trials: votes.guesses, low: Number(interval[2]), high: Number(interval[3]), metrics: { saidHuman: votes.saidHuman } };
    });
  },
};

export default board;

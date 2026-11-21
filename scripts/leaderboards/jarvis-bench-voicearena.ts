// Jarvis Bench ranks voice systems by naturalness Elo. The Voice Arena app embeds overall and domain ratings with caller-bootstrap intervals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://voicearena.com/assets/S2SLeaderboard-CHhox-Xq.js";
interface Entry { model: string; slug: string; domain: string; naturalnessElo: number; naturalnessCiLow: number; naturalnessCiHigh: number; taskElo: number; taskCiLow: number; taskCiHigh: number; naturalnessWinRate: number; taskWinRate: number; votes: number }

const board: Leaderboard = {
  benchmark: "jarvis-bench-voicearena",
  url: "https://voicearena.com/jarvis-bench",
  feed: FEED,
  terms: "Voice Arena links its site terms. https://voicearena.com/terms Voice Arena permits the public pages in robots.txt.",
  async fetch() {
    const script = (await fetchText(FEED)).replace(/human:!([01])/g, (_, n) => 'human:' + (n === '0'));
    const start = script.indexOf('[{domain:"Overall",slug:');
    if (start < 0) throw new Error('Missing Jarvis results');
    const entries = jsLiteral<Entry[]>(script, start);
    const total = entries.filter(r => r.domain === 'Overall');
    if (total.length < 7) throw new Error('Expected at least seven overall ratings');
    const parts: Record<string, string> = {};
    const rows = total.map(r => {
      const metrics: Record<string, number> = { taskElo: r.taskElo, taskLow: r.taskCiLow, taskHigh: r.taskCiHigh,
        naturalnessWinRate: r.naturalnessWinRate, taskWinRate: r.taskWinRate, votes: r.votes };
      for (const d of entries.filter(d => d.slug === r.slug && d.domain !== 'Overall')) {
        parts[d.domain] = d.domain; metrics[d.domain] = d.naturalnessElo; metrics[d.domain + ' votes'] = d.votes;
        metrics[d.domain + ' task Elo'] = d.taskElo;
      }
      if (!r.model || ![r.naturalnessElo,r.naturalnessCiLow,r.naturalnessCiHigh,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid Jarvis scores');
      return { model: r.model, score: r.naturalnessElo, low: r.naturalnessCiLow, high: r.naturalnessCiHigh, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;

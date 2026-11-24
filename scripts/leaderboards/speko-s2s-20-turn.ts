// Speko's 20-turn concierge call tests tool selection, chaining, recovery and context recall.
// The score is the deterministic capability average on a 0 to 1 scale.
// Reads all four named overall scores plus reported latency and brevity from the July 2026 blog report.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://speko.com/blog/gpt-realtime-2-1-mini-best-value';
const board: Leaderboard = {
  benchmark: 'speko-s2s-20-turn',
  url: FEED,
  feed: FEED,
  static: 'paper',
  terms: 'Speko public benchmark article. https://speko.com/terms',
  aliases: {
    // July 8, 2026 article predates Grok Voice 2.0 (July 29, 2026).
    'grok-voice-think-fast': 'grok-voice-think-fast-1',
  },
  stats: {
    latency: { name: 'End-of-turn latency', unit: 'ms', better: 'lower' },
    brevity: { name: 'Brevity score', unit: 'score', better: 'higher', note: 'Deterministic brevity score from 0 to 1.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await fetchText(FEED)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const rows: LeaderboardRow[] = [];
    const rtLat = t.match(/gpt-realtime\s+is the single clean sweep[\s\S]{0,200}?1\.00[\s\S]{0,120}?(\d+)ms/i);
    if (rtLat) {
      rows.push({ model: 'gpt-realtime', score: 1, date: '2026-07-08', metrics: { latency: Number(rtLat[1]) } });
    }
    const mini = t.match(/gpt-realtime-2\.1-mini scores ([\d.]+)/i);
    if (mini) {
      const miniLat = t.match(/2\.1-mini is mid-pack at (\d+)ms/i);
      const miniBrev = t.match(/brevity ([\d.]+)/i);
      const metrics: Record<string, number> = {};
      if (miniLat) metrics.latency = Number(miniLat[1]);
      if (miniBrev) metrics.brevity = Number(miniBrev[1]);
      rows.push({ model: 'gpt-realtime-2.1-mini', score: Number(mini[1]), date: '2026-07-08', ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    const v21 = t.match(/gpt-realtime-2\.1 lands at ([\d.]+)/i);
    if (v21) {
      rows.push({ model: 'gpt-realtime-2.1', score: Number(v21[1]), date: '2026-07-08' });
    }
    const grok = t.match(/grok-voice-think-fast\s+is the worst overall \(([\d.]+)\)/i);
    if (grok) {
      rows.push({ model: 'grok-voice-think-fast', score: Number(grok[1]), date: '2026-07-08' });
    }
    return checked(rows, 4);
  },
};
export default board;

// Speko's 20-turn concierge call tests tool selection, chaining, recovery and context recall.
// The score is the deterministic capability average on a 0 to 1 scale.
// This importer reads the benchmark article's named overall scores.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://speko.com/blog/gpt-realtime-2-1-mini-best-value';
const board: Leaderboard = {benchmark: 'speko-s2s-20-turn', url: FEED, feed: FEED, terms: 'Speko public benchmark article. https://speko.com/terms', async fetch() {
  const t = (await fetchText(FEED)).replace(/<[^>]+>/g, ' ');
  const rows: LeaderboardRow[] = [];
  if (/gpt-realtime\s+is the single clean sweep.*?1\.00/is.test(t)) rows.push({model: 'gpt-realtime', score: 1});
  const mini = t.match(/gpt-realtime-2\.1-mini scores ([\d.]+)/i); if (mini) rows.push({model: 'gpt-realtime-2.1-mini', score: Number(mini[1])});
  const grok = t.match(/grok-voice-think-fast\s+is the worst overall \(([\d.]+)\)/i); if (grok) rows.push({model: 'grok-voice-think-fast', score: Number(grok[1])});
  return checked(rows, 2);
}};
export default board;

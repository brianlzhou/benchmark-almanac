// Voice Arena ranks US English text-to-speech systems by how often listeners mistake them for humans.
// The report bundle publishes grouped vote counts and the confidence intervals for each filter.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://voicearena.com/assets/reportParts-DjlAqoWw.js";
type System = { id: string; model: string; ttfaMs: number | null; medianDecisionSec: number };
type Group = [string, string, string, string, number, number];
function rate(groups: Group[]) {
  const votes = groups.reduce((sum, group) => sum + group[4], 0);
  const fooled = groups.reduce((sum, group) => sum + group[5], 0);
  if (!votes || !Number.isFinite(fooled) || fooled > votes) throw new Error('Invalid Turing TTS votes');
  return { votes, fooled, score: 100 * fooled / votes };
}
const board: Leaderboard = {
  benchmark: "turing-tts-voicearena",
  url: "https://voicearena.com/turing-tts",
  feed: FEED,
  terms: "Voice Arena links its site terms. https://voicearena.com/terms The public results path is readable.",
  aliases: { 'Drama 3': 'fish-audio-drama-3' },
  parts: { Short: 'Short', Medium: 'Medium', Long: 'Long', F: 'Female', M: 'Male' },
  stats: {
    fooled: { name: 'Listeners fooled', unit: 'count' },
    medianDecisionSec: { name: 'Median decision time', unit: 'seconds', better: 'lower' },
    ttfaMs: { name: 'Time to first audio', unit: 'ms', better: 'lower' },
  },
  async fetch() {
    const script = await fetchText(FEED);
    const modelStart = script.search(/\[\{id:"[^"]+",model:"/);
    const groupStart = script.search(/\{"[^"]+":\[\["[FM]"/);
    const intervalStart = script.indexOf('{"All|All|All":');
    if ([modelStart, groupStart, intervalStart].includes(-1)) throw new Error('Missing Turing TTS data');
    const systems = jsLiteral<System[]>(script, modelStart);
    const groups = jsLiteral<Record<string, Group[]>>(script, groupStart);
    const intervals = jsLiteral<Record<string, { m: Record<string, number[]> }>>(script.slice(intervalStart).replace(/([\[,])\./g, '$10.'), 0);
    if (systems.length < 10 || Object.keys(groups).length !== systems.length) throw new Error('Missing Turing TTS systems');
    return systems.map(system => {
      const votes = groups[system.id];
      const { score, fooled, votes: trials } = rate(votes);
      const [low, high] = intervals['All|All|All'].m[system.id];
      const metrics: Record<string, number> = { fooled, medianDecisionSec: system.medianDecisionSec };
      if (system.ttfaMs != null) metrics.ttfaMs = system.ttfaMs;
      for (const key of Object.keys(board.parts!)) metrics[key] = rate(votes.filter(group => group[0] === key || group[1] === key)).score;
      return { model: system.model, score, low: low * 100, high: high * 100, metrics, trials };
    });
  },
};
export default board;

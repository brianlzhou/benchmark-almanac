// OmniMMI ranks its table by "avg. w/o P", excluding proactivity tasks PA and PT.
// Use that published headline, retain each numeric task as a metric, and distinguish audio input runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const PAGE = 'https://omnimmi.github.io/';
const board: Leaderboard = {
  benchmark: 'omnimmi', parts: {
  'SG 1st': { name: 'Dynamic state grounding, first stage', group: 'Task type', note: 'Cumulative accuracy through the first stage.' },
  'SG 2nd': { name: 'Dynamic state grounding, second stage', group: 'Task type', note: 'Cumulative accuracy through the second stage.' },
  'SG 3rd': { name: 'Dynamic state grounding, third stage', group: 'Task type', note: 'Cumulative accuracy through the third stage.' },
  'SG avg.': { name: 'Dynamic state grounding', group: 'Task type' },
  'MD 1st': { name: 'Multi-turn dependency reasoning, first stage', group: 'Task type', note: 'Cumulative accuracy through the first stage.' },
  'MD 2nd': { name: 'Multi-turn dependency reasoning, second stage', group: 'Task type', note: 'Cumulative accuracy through the second stage.' },
  'MD 3rd': { name: 'Multi-turn dependency reasoning, third stage', group: 'Task type', note: 'Cumulative accuracy through the third stage.' },
  'MD avg.': { name: 'Multi-turn dependency reasoning', group: 'Task type' },
  AP: { name: 'Action prediction', group: 'Task type' },
  SI: { name: 'Speaker identification', group: 'Task type' },
}, url: PAGE, feed: `${PAGE} (avg. w/o P, video and audio-input tables)`,
  terms: 'The public OmniMMI project page publishes these results. The Almanac credits and links the source.',
  aliases: {
    'VITA (Mistrl-8×7B)': 'vita',
    'Video-LLaVA (Vicuna-7B)': 'video-llava-7b',
  },
  stats: { PT: { name: 'Proactivity task score', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = tables(await fetchText(PAGE)).map(t => t.map(r => r.map(c => c.text))).filter(t => t[0]?.at(-1) === 'avg. w/o P');
    if (ts.length !== 2) throw new Error('OmniMMI video/audio tables changed');
    return ts.flatMap((t,k) => t.slice(1).filter(r => num(r.at(-1)) !== undefined).map(r => {
      let model = r[1];
      if (/^GPT-4o$|^Gemini-1\.5/.test(model)) model += ' [snapshot unspecified]';
      else if (r[2] && r[2] !== '-') model += ` (${r[2]})`;
      return { model, score: num(r.at(-1))!, setting: `${k ? 'audio input' : 'video input'}, ${r[3]} frames`,
        metrics: Object.fromEntries(t[0].slice(4,-1).flatMap((key,i) => num(r[i+4]) === undefined ? [] : [[key,num(r[i+4])!]])) };
    }));
  },
};
export default board;

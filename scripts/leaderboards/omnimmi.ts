// OmniMMI ranks its table by "avg. w/o P", excluding proactivity tasks PA and PT.
// Use that published headline, retain each numeric task as a metric, and distinguish audio input runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const PAGE = 'https://omnimmi.github.io/';
const board: Leaderboard = {
  benchmark: 'omnimmi', url: PAGE, feed: `${PAGE} (avg. w/o P, video and audio-input tables)`,
  terms: 'The public OmniMMI project page publishes these results; the Almanac credits and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = tables(await fetchText(PAGE)).map(t => t.map(r => r.map(c => c.text))).filter(t => t[0]?.at(-1) === 'avg. w/o P');
    if (ts.length !== 2) throw new Error('OmniMMI video/audio tables changed');
    return ts.flatMap((t,k) => t.slice(1).filter(r => num(r.at(-1)) !== undefined).map(r => {
      let model = r[1];
      if (/^GPT-4o$|^Gemini-1\.5/.test(model)) model += ' [snapshot unspecified]';
      else if (r[2] && r[2] !== '-') model += ` (${r[2]})`;
      return { model, score: num(r.at(-1))!, setting: `${k ? 'audio input' : 'video input'}; ${r[3]} frames`,
        metrics: Object.fromEntries(t[0].slice(4,-1).flatMap((key,i) => num(r[i+4]) === undefined ? [] : [[key,num(r[i+4])!]])) };
    }));
  },
};
export default board;

// FutureOmni: the actual result rows report future-event prediction accuracy by eight video categories and their Average, in percent. Ignore obsolete video-length header markup. Preserve the audio/video modality and parameter labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://openmoss.github.io/FutureOmni/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "futureomni",
  url: "https://openmoss.github.io/FutureOmni",
  feed: FEED,
  terms: "Public results published by the benchmark authors at openmoss.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t.some(r => r.some(c => c.text === 'Cartoon')));
    if (!t) throw new Error('FutureOmni category table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t) {
      if (r.length !== 13) continue;
      const name = text(r[1]?.html.split(/<p\b/i)[0] ?? ''), score = num(r[12]?.text);
      if (!name || score === undefined) continue;
      const metrics: Record<string, number> = {};
      ['cartoon', 'education', 'emergency', 'surveillance', 'dailyLife', 'movie', 'game', 'documentary'].forEach((k, i) => { const n = num(r[i + 4]?.text); if (n !== undefined) metrics[k] = n; });
      rows.push({ model: identity(name), score, setting: `${r[3].text}; size ${r[2].text}`, metrics });
    }
    if (!rows.length) throw new Error('FutureOmni scores missing');
    return rows;
  },
};
export default board;

// Kimi-Audio speech conversation judge average on a five-point scale, with all five ability scores retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/moonshotai/Kimi-Audio/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "kimi-audio-speech-conversation-moonshot",
  url: "https://github.com/moonshotai/Kimi-Audio",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.[0]?.text === 'Model' && t[1]?.some(c => c.text === 'Avg'));
    if (!t) throw new Error('Speech conversation table missing');
    const head = ['Model', ...t[1].map(c => c.text)];
    const out: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const score = num(r[6]?.text); if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (let i = 1; i < 6; i++) { const n = num(r[i]?.text); if (n !== undefined) metrics[head[i]] = n; }
      out.push({model: identity(r[0].text), score, metrics});
    }
    if (!out.length) throw new Error('Speech conversation rows missing');
    return out;
  },
};
export default board;

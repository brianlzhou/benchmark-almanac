// xDailyBench: the official Seed2.1 page embeds the comparison table as JSON. Use the live header row to identify models, because internal column keys refer to older model names. The xDailyBench row is the reported percentage score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, jsonAfter } from '../lib/html.ts';

const FEED = "https://seed.bytedance.com/en/seed2_1";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "xdailybench-bytedance",
  url: "https://seed.bytedance.com/en/seed2_1",
  feed: FEED,
  terms: "Public results published by the benchmark authors at seed.bytedance.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const data = jsonAfter<Array<Record<string, unknown>>>(await fetchText(FEED), '"tableDataSource":');
    const header = data[0], result = data.find(r => r.benchmark === 'xDailyBench');
    if (!header || !result) throw new Error('xDailyBench comparison row missing');
    const rows: LeaderboardRow[] = [];
    for (const [key, label] of Object.entries(header)) {
      if (['capability', 'benchmark'].includes(key) || typeof label !== 'string') continue;
      const score = typeof result[key] === 'string' ? num(result[key] as string) : undefined;
      if (score !== undefined) rows.push({ model: identity(label.replace(/\s+/g, ' ').trim()), score });
    }
    if (!rows.length) throw new Error('xDailyBench scores missing');
    return rows;
  },
};
export default board;

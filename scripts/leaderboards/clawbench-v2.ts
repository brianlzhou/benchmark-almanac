// ClawBench V2 reward percentages. Retain the dataset rows and supplement the official website’s 130-task OpenClaw cohort absent from that feed.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';
import {clawRows} from './clawbench.ts';
const FEED = "https://claw-bench.com/leaderboard";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "clawbench-v2",
  url: "https://claw-bench.com/leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at claw-bench.com. Retain source attribution and follow the upstream terms.",
  stats: {
    intercepted: { name: 'Intercepted rate', unit: '%', better: 'higher' },
    strictReward: { name: 'Strict reward', unit: '%', better: 'higher' },
  },
  aliases: {},
  async fetch() {
    const out = await clawRows('v2');
    const ts = tables(await fetchText(FEED));
    for (const t of ts) {
      if (!t[0]?.some(c => c.text === 'Reward')) continue;
      for (const r of t.slice(1)) {
        if (!r[7]?.text.endsWith('/ 130')) continue;
        const harness = r[2]?.text;
        const model = r[1]?.text;
        const intercepted = num(r[4]?.text);
        const strictReward = num(r[5]?.text);
        const existing = out.find(v => v.harness === harness && v.model === model);
        if (existing) {
          if (intercepted !== undefined || strictReward !== undefined) {
            existing.metrics = { ...existing.metrics, ...(intercepted !== undefined ? { intercepted } : {}), ...(strictReward !== undefined ? { strictReward } : {}) };
          }
          continue;
        }
        if (harness !== 'openclaw') continue;
        const score = num(r[3].text);
        if (score === undefined) continue;
        const cost = num(r[6].text);
        out.push({ model, score, harness: 'openclaw', cost, metrics: { ...(intercepted !== undefined ? { intercepted } : {}), ...(strictReward !== undefined ? { strictReward } : {}) } });
      }
    }
    return out;
  },
};
export default board;

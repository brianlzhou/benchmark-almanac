// AgenticVBench: average video-editing task score in percent from the server-rendered leaderboard. Each model/harness pair remains separate. Retain the published uncertainty, task-family percentages, and submission date; exclude the human reference.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://agenticvbench.com/leaderboard";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "agenticvbench",
  url: "https://agenticvbench.com/leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at agenticvbench.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Harness') && t[0]?.some(c => c.text === 'Repurpose'));
    if (!t) throw new Error('AgenticVBench table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const name = r[1]?.text, score = num(r[3]?.text);
      if (!name || /^human/i.test(name) || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [k, i] of [['repurpose', 4], ['sequence', 5], ['repair', 6], ['assembly', 7]] as const) { const v = num(r[i]?.text); if (v !== undefined) metrics[k] = v; }
      const uncertainty = num(r[3]?.text.split('±')[1]); if (uncertainty !== undefined) metrics.reportedUncertainty = uncertainty;
      rows.push({ model: identity(name), score, harness: r[2]?.text, date: /^\d{4}-\d{2}-\d{2}$/.test(r[9]?.text) ? r[9].text : undefined, metrics });
    }
    if (!rows.length) throw new Error('AgenticVBench scores missing');
    return rows;
  },
};
export default board;

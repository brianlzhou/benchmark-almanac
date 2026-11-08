// AgentBoard reports the published Avg progress rate percentage across all nine environments.
// Task and group progress rates are secondary metrics, alongside overall success and grounding.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://hkust-nlp.github.io/agentboard/data/To_Release/main_data_new.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "agentboard",
  url: "https://hkust-nlp.github.io/agentboard/static/leaderboard.html",
  feed: FEED,
  terms: "Public results published by the benchmark authors at hkust-nlp.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const data = await fetchJson<any[]>(FEED);
    const out:LeaderboardRow[]=[];
    for (const r of data) {
      const overall = r.tasks.Avg;
      const score = num(overall?.score);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const key of ['accuracy', 'grounding']) {
        const n = num(overall[key]);
        if (n !== undefined) metrics[key] = n;
      }
      for (const [task, value] of Object.entries(r.tasks) as [string, any][]) {
        if (task === 'Avg') continue;
        const n = num(value.score);
        if (n !== undefined) metrics[task.toLowerCase().replace(/-/g, '_')] = n;
      }
      out.push({model: identity(r.model), score, metrics});
    }
    if(!out.length)throw new Error('AgentBoard results missing');return out;
  },
};
export default board;

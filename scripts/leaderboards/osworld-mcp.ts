// Read run counts and step limits from Details and the listed company for agent frameworks.
// OSWorld-MCP task accuracy percentages by step budget and prompt. Keep tool invocation rate and action compression separately; named agent frameworks remain harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://osworld-mcp.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "osworld-mcp",
  url: "https://osworld-mcp.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at osworld-mcp.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  stats: {
    TIR: { name: 'Tool invocation rate', unit: '%', better: 'higher' },
    ACS: { name: 'Action compression score', unit: '%', better: 'higher' },
    maxSteps: { name: 'Maximum steps', unit: 'count' },
  },
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'TIR'));
    if (!t) throw new Error('OSWorld-MCP leaderboard missing');
    const out: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[3]?.text); if (score === undefined) continue;
      const label = text(r[1].html.match(/class="model-name"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '');
      const version = text(r[1].html.match(/class="model-version"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '');
      const agent = /Agentic framework/.test(r[2].text);
      const metrics: Record<string, number> = {};
      for (const [k,i] of [['TIR',4],['ACS',5]] as const) { const v = num(r[i]?.text); if (v !== undefined) metrics[k] = v; }
      const maxSteps = r[2].text.match(/Max Steps:\s*(\d+)/i);
      if (maxSteps) metrics.maxSteps = Number(maxSteps[1]);
      const runs = r[2].text.match(/Runs:\s*(\d+)/i);
      const company = text(r[1].html.match(/class="model-company"[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '');
      out.push({trials: runs ? Number(runs[1]) : undefined, agentOrg: agent ? company || undefined : undefined, model: identity((version || label).replace(/-thinking$/, '')), score, setting: (/thinking$/.test(version) ? 'thinking; ' : '') + r[2].text.replace(/^Type:.*?(?=Max Steps:)/,''), harness: agent ? label : undefined, metrics});
    }
    if (!out.length) throw new Error('OSWorld-MCP scores missing');
    return out;
  },
};
export default board;

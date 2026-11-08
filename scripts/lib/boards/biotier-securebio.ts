// BioTIER defines separate refuse (398 prompts) and permit (144 prompts) test sets. Each child uses correct compliance in percent.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../html.ts';
import { sbCharts } from '../../leaderboards/hpct-v2-securebio.ts';
const FEED = "https://securebio.org/benchmarks/details/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "biotier-securebio",
  url: "https://securebio.org/benchmarks/details/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at securebio.org; retain source attribution and follow the upstream terms.",
  aliases: {"GPT-4o (Aug '24)": "gpt-4o-aug-2024", "GPT-4o (Nov '24)": "gpt-4o-nov-2024", "Claude Sonnet 3.5 (Oct '24)": "claude-3-5-sonnet-october-2024", "Claude Sonnet 3.5 (Jun '24)": "claude-3-5-sonnet", "DeepSeek R1 (0528)": "deepseek-r1-may-2025"},
  
  async fetch() {
    const out = new Map<string, LeaderboardRow>();
    for (const c of await sbCharts()) {
      if (!/biotier-refuse-permit/.test(c.title)) continue;
      for (const h of c.hovers) {
        const lines = h.split(/<br>/i).map(text).filter(Boolean);
        const name = lines[0]; if (!name) continue;
        const m = name.match(/^(.*?)\s*(?:\[([^\]]+)\])?$/)!;
        for (const metric of ['refuse', 'permit']) {
          const score = lines.find(l => l.startsWith(`BioTIER-${metric}:`))?.match(/:\s*([\d.]+)%/)?.[1];
          if (score === undefined) continue;
          const setting = [`BioTIER-${metric}`, m[2]].filter(Boolean).join('; ');
          out.set(`${name}:${metric}`, {model: identity(m[1].trim()), score: Number(score), setting});
        }
      }
    }
    if (!out.size) throw new Error('BioTIER score hovers missing');
    return [...out.values()];
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}

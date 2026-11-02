// SWE-rebench (Nebius) on swe-rebench.com. The leaderboard page is server-rendered with one table for the
// default time window (the newest set of fresh tasks): # | Model | Resolved Rate (%) | Pass@5 (%) | Cost per
// Problem ($) | Tokens per Problem. The resolved rate (0 to 100, shown with its spread) is the score and
// the cost per problem the cost of one task. The model cell holds the developer's logo (its title names
// the developer), the name with the effort in brackets ("Fable 5 [high]") and a tag, Model or Agent. Agent
// rows (products such as Junie) are skipped, and models with no run in the window show N/A and are
// skipped too. SWE-rebench is a rolling board, so the rows follow the window the site shows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://swe-rebench.com/leaderboard';

// short names the board uses under a developer logo, completed with the family name
const FAMILY: Record<string, string> = { Anthropic: 'Claude', Google: 'Gemini' };

const board: Leaderboard = {
  benchmark: 'swe-rebench',
  url: URL,
  feed: `${URL} (default window table)`,
  terms: 'Server-rendered public page; robots.txt allows all paths and the site publishes no terms.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((x) => x[0]?.some((c) => /^Resolved Rate/.test(c.text)));
    if (!t) throw new Error('SWE-rebench table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iScore = head.findIndex((h) => /^Resolved Rate/.test(h));
    const iCost = head.findIndex((h) => /^Cost per Problem/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.html ?? '';
      const dev = cell.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? '';
      const parts = [...cell.replace(/<svg[\s\S]*?<\/svg>/g, '').matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean);
      const score = num(r[iScore]?.text);
      if (parts.at(-1) !== 'Model' || !parts[0] || score === undefined) continue;
      const effort = parts[0].match(/\s*\[([^\]]+)\]$/);
      let model = effort ? parts[0].slice(0, effort.index).trim() : parts[0];
      const family = FAMILY[dev];
      if (family && !model.toLowerCase().startsWith(family.toLowerCase())) model = `${family} ${model}`;
      rows.push({ model, score, setting: effort?.[1].toLowerCase(), cost: iCost >= 0 ? num(r[iCost]?.text) : undefined });
    }
    if (!rows.length) throw new Error('no model rows in the SWE-rebench table');
    return rows;
  },
};
export default board;

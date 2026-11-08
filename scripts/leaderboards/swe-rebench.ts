// SWE-rebench (Nebius) on swe-rebench.com. The leaderboard page is server-rendered with one table for the
// default time window (the newest set of fresh tasks): # | Model | Resolved Rate (%) | Pass@5 (%) | Cost per
// Problem ($) | Tokens per Problem. The resolved rate (0 to 100, shown with its spread) is the score and
// the cost per problem the cost of one task. The model cell holds the developer's logo (its title names
// the developer), the name with the effort in brackets ("Fable 5 [high]") and a tag, Model or Agent. Agent rows remain unlisted systems. Only models with results in the default window are retained.
// Historical windows are incompatible task sets and are excluded. SWE-rebench is a rolling board, so the rows follow the window the site shows.
// Pass@5 is metrics.pass5 and the ± after the rate, its standard error (SEM), metrics.sem. Tokens per
// Problem counts input and cached tokens, not output alone, so it is retained as metrics.totalTokens rather than output tokens.
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
    const html = await fetchText(URL);
    const t = tables(html).find((x) => x[0]?.some((c) => /^Resolved Rate/.test(c.text)));
    if (!t) throw new Error('SWE-rebench table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iScore = head.findIndex((h) => /^Resolved Rate/.test(h));
    const iCost = head.findIndex((h) => /^Cost per Problem/.test(h));
    const iPass5 = head.findIndex((h) => /^Pass@5/.test(h));
    const rows: LeaderboardRow[] = [];
    const seen = new Set<string>();
    const iTokens = head.indexOf('Tokens per Problem');
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.html ?? '';
      const dev = cell.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? '';
      const parts = [...cell.replace(/<svg[\s\S]*?<\/svg>/g, '').matchAll(/>([^<>]+)</g)].map((m) => m[1].trim()).filter(Boolean);
      const score = num(r[iScore]?.text);
      if (!['Model', 'Agent'].includes(parts.at(-1) ?? '') || !parts[0] || score === undefined) continue;
      seen.add(parts[0]);
      const effort = parts[0].match(/\s*\[([^\]]+)\]$/);
      let model = effort ? parts[0].slice(0, effort.index).trim() : parts[0];
      const family = FAMILY[dev];
      if (family && !model.toLowerCase().startsWith(family.toLowerCase())) model = `${family} ${model}`;
      const metrics: Record<string, number> = {};
      const totalTokens = iTokens >= 0 ? num(r[iTokens]?.text) : undefined;
      if (totalTokens !== undefined) metrics.totalTokens = totalTokens;
      // "64.5% ± 1.41%": the resolved rate and its standard error over the runs
      const sem = r[iScore]?.text.match(/±\s*([\d.]+)/);
      if (sem) metrics.sem = Number(sem[1]);
      const pass5 = iPass5 >= 0 ? num(r[iPass5]?.text) : undefined;
      if (pass5 !== undefined) metrics.pass5 = pass5;
      rows.push({
        model,
        score,
        setting: effort?.[1].toLowerCase(),
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    if (!rows.length) throw new Error('no SWE-rebench results');
    // A submission date alone does not identify an undated model snapshot.
    return rows.map(r => ({...r, model: /^(?:gpt[- ]?4o|gemini[- ]?[12][.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
  },
};
export default board;

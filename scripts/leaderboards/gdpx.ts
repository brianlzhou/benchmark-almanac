// GDPx: equal-domain, equal-partner average of the official task scores (percent).
// Discovers the current data bundle and includes the full model cohort, not the default selection.
// Overall cost and output tokens are the publisher’s per-task averages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { text, tables, num, jsonAfter } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://gdpx.semianalysis.com/";
const board: Leaderboard = {
  "benchmark": "gdpx",
  "url": "https://gdpx.semianalysis.com/",
  "feed": "https://gdpx.semianalysis.com/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors.",
  "chart": {
    "title": "Cost vs. Performance Pareto Frontier",
    "x": {
      "key": "cost",
      "label": "Average cost per task",
      "unit": "$",
      "better": "lower",
      "log": true
    },
    "y": {
      "key": "score",
      "label": "GDPx score",
      "unit": "%",
      "better": "higher"
    }
  }
,
  async fetch(): Promise<LeaderboardRow[]> {

    const html = await fetchText(FEED);
    const paths = [...new Set([...html.matchAll(/<script[^>]+src="([^"?]+\.js)[^"]*"/g)].map(m => m[1]))];
    let data: any; let bundle = '';
    for (const path of paths) {
      await new Promise(r => setTimeout(r, 1000));
      const script = await fetchText(new URL(path, FEED).href);
      const literal = [...script.matchAll(/JSON\.parse\('((?:\\.|[^'\\])*)'\)/g)].find(m => m[1].includes('"models"') && m[1].includes('"overall"'));
      if (literal) { data = JSON.parse(literal[1].replace(/\\'/g, "'")); bundle = script; break; }
    }
    if (!data?.models || !data?.results) throw new Error('GDPx data bundle missing');
    const partnerDomain = new Map<string, string>();
    for (const m of bundle.matchAll(/\("([\w-]+)","[^"\\]+","([\w-]+)","\/partners\//g)) partnerDomain.set(m[1], m[2]);
    if (!partnerDomain.size) throw new Error('GDPx domain mapping missing');
    const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const rows: LeaderboardRow[] = [];
    for (const model of data.models) {
      const groups = new Map<string, number[]>();
      for (const result of data.results.filter((r: any) => r.modelId === model.id && r.tasksScored > 0 && Number.isFinite(r.score))) {
        const domain = partnerDomain.get(result.partnerId);
        if (!domain) throw new Error(`Unknown partner ${result.partnerId}`);
        groups.set(domain, [...(groups.get(domain) ?? []), result.score]);
      }
      if (!groups.size) continue;
      const metrics = Object.fromEntries([...groups].map(([key, values]) => [key, average(values)]));
      const overall = data.overall[model.id];
      if (Number.isFinite(overall?.costPerTask)) metrics.cost = overall.costPerTask;
      if (Number.isFinite(overall?.tokensPerTask)) metrics.outputTokens = overall.tokensPerTask;
      rows.push({ model: model.name, score: average([...groups.values()].map(average)), harness: model.harness, setting: model.reasoning, cost: overall?.costPerTask ?? undefined, tokens: overall?.tokensPerTask ?? undefined, metrics });
    }
    return rows;
  },
};
export default board;

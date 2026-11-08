// MusTBench: the live JSON reports overall music temporal-understanding performance on a 0–100 scale. Keep all grounding submetrics and the explicitly stated model size; MusT fine-tunes retain their full names instead of being credited to base models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://daeyongkwon98.github.io/mustbench/data/leaderboard.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mustbench",
  url: "https://daeyongkwon98.github.io/mustbench/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at daeyongkwon98.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const data = await fetchJson<Array<Record<string, unknown> & { model: string; size: string; overall: number }>>(FEED);
    const rows = data.filter(r => r.model && Number.isFinite(r.overall)).map(r => ({
      model: identity(r.size && r.size !== '--' ? `${r.model} ${r.size}` : r.model), score: r.overall,
      metrics: Object.fromEntries(Object.entries(r).filter(([k, v]) => k !== 'overall' && typeof v === 'number' && Number.isFinite(v))) as Record<string, number>,
    }));
    if (!rows.length) throw new Error('MusTBench scores missing');
    return rows;
  },
};
export default board;

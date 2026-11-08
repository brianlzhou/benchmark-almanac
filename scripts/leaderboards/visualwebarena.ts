// VisualWebArena task success percentages from the complete official results table. Expand merged cells and preserve input modality and visual backbone.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://jykoh.com/vwa";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "visualwebarena",
  url: "https://jykoh.com/vwa",
  feed: FEED,
  terms: "Public results published by the benchmark authors at jykoh.com; retain source attribution and follow the upstream terms.",
  aliases: {"LLaMA-3-70B-Instruct": "llama-3-70b"},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'LLM Backbone'));
    if (!t) throw new Error('VisualWebArena results table missing');
    const spans = new Map<number, {text: string; left: number}>();
    const out: LeaderboardRow[] = [];
    for (const cells of t.slice(1)) {
      const r: string[] = []; let col = 0;
      function fill() { while (spans.has(col)) { const s = spans.get(col)!; r[col] = s.text; if (--s.left === 0) spans.delete(col); col++; } }
      for (const c of cells) {
        fill(); const width = Number(c.attrs.colspan ?? 1), height = Number(c.attrs.rowspan ?? 1);
        for (let i=0;i<width;i++) { r[col] = c.text; if (height > 1) spans.set(col,{text:c.text,left:height-1}); col++; }
      }
      fill();
      if (/human/i.test(r[0])) continue;
      const score = num(r[4]); if (score === undefined || !r[1]) continue;
      out.push({model: identity(r[1]), score, setting: `${r[0]}; ${r[3]}`, harness: r[2] !== '-' && r[2] !== r[1] ? `Visual backbone: ${r[2]}` : undefined});
    }
    if (!out.length) throw new Error('VisualWebArena score rows missing');
    return out;
  },
};
export default board;

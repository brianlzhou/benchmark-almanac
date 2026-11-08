// PhyX: the page initializes sorting on pro.overall, the open-ended accuracy.
// Keep that default testmini / Text-DeRedundancy score in percent. Multiple-choice
// accuracy and physics domains remain metrics, not separate headline rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://killthefullmoon.github.io/projects/PhyX/leaderboard_data.json";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "phyx",
  url: "https://killthefullmoon.github.io/projects/PhyX/index.html",
  feed: FEED,
  terms: "Public results published by the benchmark authors at killthefullmoon.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"GPT-o4-mini": "o4-mini", "GPT-o3-mini": "o3-mini", "Kimi-VL-A3B-Instruct-2.8B": "kimi-vl-a3b-instruct"},
  
  async fetch() {
    type Entry = { info: { name: string; type: string }; pro: Record<string, string>; validation: Record<string, string>; test: Record<string, string> };
    const { leaderboardData } = await fetchJson<{ leaderboardData: Entry[] }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of leaderboardData) {
      const name = r.info.name.trim();
      if (/human|random/i.test(name)) continue;
      for (const [key, label] of [['pro', 'OE'], ['validation', 'MC']] as const) {
        const score = num(r[key].overall); if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        const fields = key === 'pro' ? { fullText: r.pro.vision, textMinimal: r.pro.original, mechanics: r.test.artDesign, electromagnetism: r.test.business, thermodynamics: r.test.science, wavesAcoustics: r.test.healthMedicine, optics: r.test.humanSocialSci, modernPhysics: r.test.techEng } : { fullText: r.validation.artDesign, textMinimal: r.validation.business };
        for (const [k, v] of Object.entries(fields)) { const n = num(v); if (n !== undefined) metrics[k] = n; }
        rows.push({ model: identity(name), score, setting: `testmini; ${label}; Text-DeRedundancy`, metrics });
      }
    }
    if (!rows.length) throw new Error('PhyX score entries missing');
    return rows.filter(r=>r.setting==='testmini; OE; Text-DeRedundancy').map(r=>{
      const mc=rows.find(x=>x.model===r.model&&x.setting==='testmini; MC; Text-DeRedundancy');
      return {...r,metrics:{...r.metrics,...(mc?{mc:mc.score,...Object.fromEntries(Object.entries(mc.metrics??{}).map(([k,v])=>['mc_'+k,v]))}:{})}};
    });
  },
};
export default board;

// SoccerNet-Caption: 2023 challenge METEOR scores on the published scale.
// Decodes the official embedded HTML table without executing its code; caption metrics remain attached.
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


const FEED = "https://www.soccer-net.org/tasks/dense-video-captioning";
const board: Leaderboard = {
  "benchmark": "soccernet-caption",
  "url": "https://www.soccer-net.org/tasks/dense-video-captioning",
  "feed": "https://www.soccer-net.org/tasks/dense-video-captioning",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const html=await fetchText(FEED);
    const data=[...html.matchAll(/data-code="([^"]*)"/g)].flatMap(m=>tables(text(m[1])));
    const t=data.find(t=>t[0]?.some(c=>c.text==='METEOR'));if(!t)throw new Error('Embedded METEOR table missing');
    return t.slice(1).filter(r=>num(r[1]?.text)!==undefined).map(r=>{
      const metrics:Record<string,number>={};for(let i=2;i<r.length;i++){const n=num(r[i].text);if(n!==undefined)metrics[t[0][i].text]=n;}
      return {model:`${r[0].text} captioning system`,score:num(r[1].text)!,setting:'2023 challenge',metrics};
    });
  },
};
export default board;

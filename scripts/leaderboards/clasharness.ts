// CLASHarness all-pass percentage on 600 episodes, with difficulty and mean-check scores.
// High, medium and low effort remain separate. Reported cost and token totals stay metrics because
// the README does not identify output-only tokens or a per-task cost denominator.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, tables } from '../lib/html.ts';

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


const FEED = "https://raw.githubusercontent.com/google-research/CLASHarness/main/README.md";
const board: Leaderboard = {
  "benchmark": "clasharness",
  "url": "https://github.com/google-research/CLASHarness",
  "feed": "https://raw.githubusercontent.com/google-research/CLASHarness/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const data = tables(await fetchText(FEED));
    const rows = new Map<string,LeaderboardRow>();
    const main=data.find(t=>t[0]?.some(c=>c.text.includes('Avg. Cost')));
    const sweep=data.find(t=>t[0]?.some(c=>c.text==='Effort'));
    if(!main || !sweep)throw new Error('CLASHarness results missing');
    const add=(model:string,effort:string,cells:string[],previous?:LeaderboardRow)=>{
      const score=numeric(cells[0]);if(score===undefined)return;
      const metrics:Record<string,number>={...previous?.metrics};
      for(const [i,k] of ['easy','medium','hard','meanCheckScore'].entries()){const n=numeric(cells[i+1]);if(n!==undefined)metrics[k]=n;}
      rows.set(`${model}|${effort}`,{model:identity(model),score,setting:effort,harness:'CLASHarness',metrics});
    };
    for(const r of main.slice(2)) {
      const model=r[0].text.replace(/†/g,'').trim();const c=r.map(c=>c.text);add(model,'high',c.slice(1));
      const row=rows.get(`${model}|high`)!;const cost=c[6]?.match(/\$([\d,]+)/);const tokens=c[6]?.match(/\(([\d.]+)M\)/);
      if(cost)row.metrics!.reportedCostUsd=Number(cost[1].replace(/,/g,''));
      if(tokens)row.metrics!.reportedTokens=Number(tokens[1])*1e6;
      if(/†/.test(r[0].text))row.setting+='; OCR transcripts';
    }
    let model='';
    for(const r of sweep.slice(2)) {
      const c=r.map(c=>c.text);if(c.length===7)model=c.shift()!.replace(/†/g,'').trim();
      const effort=c.shift()?.toLowerCase().replace('med','medium');if(!model||!effort)continue;
      const previous=rows.get(`${model}|${effort}`);if(previous)continue;add(model,effort,c);
    }
    return [...rows.values()];
  },
};
export default board;

// ETHICS: Average accuracy from the primary Test Set Results table, in percent.
// The separate Hard Test Set average and categories remain metrics; no split average is invented.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, "")));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, "")))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/hendrycks/ethics/master/README.md";
const board: Leaderboard = {
  benchmark: "ethics-hendrycks", url: "https://raw.githubusercontent.com/hendrycks/ethics/master/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const ts=all.filter(t=>t[0]?.includes("Average")&&t[0]?.includes("Justice"));if(ts.length!==2)throw new Error("Expected two ETHICS tables");for(const [j,t] of ts.entries())for(const r of t.slice(1)){if(/random/i.test(r[0]))continue;const score=num(r[6]);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=1;i<6;i++){const n=num(r[i]);if(n!==undefined)metrics[t[0][i]]=n;}rows.push({model:r[0],score,setting:j===0?"standard":"hard",metrics});}
    if (!rows.length) throw new Error("No ethics-hendrycks score rows");
    return rows.filter(r=>r.setting==='standard').map(r=>{
      const hard=rows.find(x=>x.model===r.model&&x.setting==='hard');
      return {...r,metrics:{...r.metrics,...(hard?{hard:hard.score,...Object.fromEntries(Object.entries(hard.metrics??{}).map(([k,v])=>['hard_'+k.toLowerCase().replace(/[^a-z0-9]+/g,'_'),v]))}:{})}};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;


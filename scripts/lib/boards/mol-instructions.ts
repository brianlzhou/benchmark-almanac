// Mol-Instructions publishes complete task sets for molecular generation and biomedical NLP. Each child uses Exact, accuracy, or F1 as explicitly labeled by the source.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/zjunlp/Mol-Instructions/main/README.md";
const board: Leaderboard = {
  benchmark: "mol-instructions", url: "https://raw.githubusercontent.com/zjunlp/Mol-Instructions/main/README.md", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    const generation=all.filter(t=>t[0].includes("Exact↑"));const labels=["Description-guided Molecule Design","Forward Reaction Prediction","Retrosynthesis","Reagent Prediction"];if(generation.length!==labels.length)throw new Error("Molecular task layout changed");
    for(const [i,t] of generation.entries())for(const r of t.slice(1)){const v=num(r[1]);if(v===undefined)continue;rows.push({model:r[0].replace(/^Ours/,"Mol-Instructions"),score:v*100,setting:labels[i]+", exact match",metrics:Object.fromEntries(t[0].slice(2).flatMap((h,j)=>{const n=num(r[j+2]);return n===undefined?[]:[[h,n]];}))});}
    const bio=all.find(t=>t[0].includes("True or False"));if(bio)for(const r of bio.slice(2))for(let i=1;i<bio[0].length;i++){const v=num(r[i]);if(v!==undefined)rows.push({model:r[0].replace(/^Ours/,"Mol-Instructions"),score:v*100,setting:bio[0][i]+", "+bio[1][i]});}
    if (!rows.length) throw new Error("No mol-instructions score rows");
    return rows;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}

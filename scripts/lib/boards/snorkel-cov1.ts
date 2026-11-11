// Archived Snorkel boards publish complete static tables, including initially hidden rows.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num } from '../html.ts';
export function snorkelArchived(benchmark: string, slug: string): Leaderboard {
 const url = `https://snorkel.ai/leaderboard/${slug}/`;
 return { benchmark, url, feed: `${url} (Rank, Model, Score table)`,
  terms: 'Snorkel terms prohibit automated extraction and republication; the Almanac credits Snorkel and links the original source.',
  aliases: {'o4 mini':'o4-mini','Claude Sonnet 3.7':'claude-3-7-sonnet','NVIDIA Nemotron Super 49B v1.5':'llama-3-3-nemotron-super-49b-v1-5','NVIDIA Nemotron Super 49B':'llama-3-3-nemotron-super-49b-v1','Nova Pro':'amazon-nova-pro','Nova Lite':'amazon-nova-lite','Nova Micro':'amazon-nova-micro'},
  async fetch(): Promise<LeaderboardRow[]> {
   const table = tables(await fetchText(url)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|')==='Rank|Model|Score');
   if (!table) throw new Error('Snorkel archived results table missing');
   const rows: LeaderboardRow[]=[];
   for (const r of table.slice(1)) {
    const score=num(r[2]); if(score===undefined || !r[1])continue;
    // These undated labels can name multiple API releases or model variants.
    const model=/^(Gemini 2\.5 (Pro|Flash)|Mistral Large|Magistral Medium|Codestral|Qwen 3 235B|Nvidia 70B Instruct)$/i.test(r[1]) ? `${r[1]} [snapshot unspecified]` : r[1];
    rows.push({model,score});
   }
   if(!rows.length)throw new Error('No Snorkel score rows');
   return rows;
  }
 };
}

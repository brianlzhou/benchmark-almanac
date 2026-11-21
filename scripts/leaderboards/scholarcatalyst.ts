// ScholarCatalyst: Core Research Query R@20 over 207 projects is recall, expressed as percent.
// Read the complete retriever appendix and add agent configurations from the main table.
// The resource table gives agent costs, calls and median latency by backbone. Other recall and nDCG metrics remain metrics. Post-cutoff comparison rows retain a setting.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
const FEED = "https://arxiv.org/html/2610.02202";
const board: Leaderboard = {
 benchmark: "scholarcatalyst", static: 'paper',
 parts: {
   subfieldRecall20: { name: 'Subfield-specific query', group: 'Task type', note: 'Recall@20 on the 687 subfield-specific queries.' },
 },
 url: "https://arxiv.org/html/2610.02202",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=flatPaperTables(await fetchText(FEED)).map(grid);const sizes=new Map<string,number>();
 for(const t of ts.filter(t=>t[0]?.[0]==='Model'&&t[0]?.[1]==='Size'))for(const r of t.slice(1)){const size=r[1]?.match(/^(\d+(?:\.\d+)?)([MB])$/);if(size)sizes.set(r[0].split(' (')[0],Number(size[1])*(size[2]==='M'?0.001:1));}
 const resources=ts.find(t=>t[0][0]==='Agent' && t[0].includes('Median time (s)'));
 const candidates=ts.filter(t=>t[1]?.join('|')==='Model|nDCG@20|R@5|R@20|R@100|nDCG@20|R@5|R@20|R@100');const main=candidates.find(t=>t[0][1].includes('207'));const full=candidates.find(t=>t.some(r=>r[0]==='SciNCL'));if(!main||!full)throw new Error('ScholarCatalyst tables missing');const rows:LeaderboardRow[]=[];
 for(const r of [...full.slice(2),...main.slice(2).filter(r=>r[0].includes(' + '))]){if(num(r[3])===undefined||new Set(r).size===1)continue;let [model,harness]=r[0].split(' + ');if(model==='Fable 5.1')model='Claude Fable 5.1';const use=resources?.find(c=>c[1]===model && c[0]+' Agent'===harness);rows.push({model,harness,cost:num(use?.[4]),params:sizes.get(model),score:num(r[3])!*100,setting:model==='Claude Fable 5.1'?'post-cutoff comparison':undefined,metrics:{...(use?{toolCalls:num(use[2])!,backboneCalls:num(use[3])!,totalCost:num(use[5])!,latency:num(use[6])!}:{}),subfieldNdcg20:num(r[5])!,subfieldRecall5:num(r[6])!*100,subfieldRecall100:num(r[8])!*100,ndcg20:num(r[1])!,recall5:num(r[2])!*100,recall100:num(r[4])!*100,subfieldRecall20:num(r[7])!*100}});}return checked(rows,19);
 },
};
export default board;

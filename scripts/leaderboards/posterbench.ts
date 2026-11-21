// Read the 100-paper score and the matching main-track result on the 10-paper subset.
// Use only the full 100-paper main track, not the 10-paper controlled subset.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://raw.githubusercontent.com/Yaxin9Luo/AutoDesign/HEAD/README.md";
const board:Leaderboard={benchmark:"posterbench",harnesses:'system',url:FEED,feed:FEED,
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 parts: {smallScale: {name: 'Small-Scale Main Track', group: 'Subset', note: 'Fixed 10-paper subset.'}},
 async fetch(){
 const source = await fetchText(FEED);
 const scores = (section: string) => markdownTables(section).find(t => t[0]?.includes('Design harness'));
 const t = scores(source);
 if (!t) throw new Error('Main track missing');
 const subset = scores(source.split('Small-Scale Benchmark Main Track')[1]?.split('</details>')[0] ?? '');
 const key = (r: string[]) => JSON.stringify(r.slice(2, 6));
 const small = new Map(subset?.slice(1).map(r => [key(r), Number(r[1])]));
 const out: LeaderboardRow[] = [];
 for (const c of t.slice(1)) {
   const sub = small.get(key(c));
   out.push({model:c[5],score:Number(c[1]),harness:[c[2],c[3],c[4]].filter(x=>x!=='—').join(' / '),
     setting:'100-paper main track', metrics: sub !== undefined && Number.isFinite(sub) ? {smallScale: sub} : undefined});
 }
 return checked(out,3);
 }};export default board;

// Exact day-seven counts, summed across the four matched businesses per model.
// The maker's headline adds ad impressions and organic site visitors. Never evaluate the bundle.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
const FEED='https://eico.so/_next/static/chunks/0dz27nhmwuqc_.js';
const board:Leaderboard={benchmark:'founder-bench-eico',url:'https://eico.so/founder-bench',feed:FEED,
 terms:'Public maker results; robots.txt permits the results and static assets. No additional reading restriction is stated.',
 aliases:{'accounts/fireworks/models/glm-5p2':'glm-5-2'},
 async fetch(){const s=await fetchText(FEED);const models=new Map<string,{score:number;impressions:number;traffic:number;spendCents:number;n:number}>();
 for(const m of s.matchAll(/\{co:"[^"\n]+",model:"([^"\n]+)",impr:(\d+),clicks:\d+,spendCents:(\d+),tasks:\d+,sent:\d+,opened:\d+,leads:\d+,traffic:(\d+)\}/g)){
 const r=models.get(m[1])??{score:0,impressions:0,traffic:0,spendCents:0,n:0};r.impressions+=Number(m[2]);r.spendCents+=Number(m[3]);r.traffic+=Number(m[4]);r.n++;r.score=r.impressions+r.traffic;models.set(m[1],r);
 }if(models.size!==5||[...models.values()].some(r=>r.n!==4))throw new Error('Matched business cohort changed');
 return [...models].map(([model,r])=>({model,score:r.score,harness:'acoco',setting:'2026-07-22; day 7; four businesses',metrics:{adImpressions:r.impressions,siteVisitors:r.traffic,adSpendUSD:r.spendCents/100}}));
 }};export default board;

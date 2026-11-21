// Keep each submitting team and its listed affiliations. Rubrics is the challenge ranking score.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://audio-reasoning-challenge.github.io/leaderboard/";
const board:Leaderboard={benchmark:"audio-reasoning-challenge-2026",url:FEED,feed:FEED,
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));const out:LeaderboardRow[]=[];
for(const [i,t] of ts.filter(t=>t[0]?.includes('Rubrics')).entries())for(const c of t.slice(1))out.push({model:c[1]+' (challenge submission)',score:Number(c[3]),submitter:c[2] && c[2] !== '-' ? c[1]+' ('+c[2]+')' : c[1],setting:i===0?'single-model track':'agent track',metrics:{accuracy:Number(c[4])}});
 return checked(out,3);
 }};export default board;

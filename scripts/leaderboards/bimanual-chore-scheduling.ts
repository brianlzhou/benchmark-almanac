// Bimanual Chore Scheduling tests language models on constrained two-handed task planning.
// The repository README reports the named model comparison and mean reward.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/JWilksBooth/bimanual-chore-scheduling/main/README.md';
const board:Leaderboard={benchmark:'bimanual-chore-scheduling',url:'https://github.com/JWilksBooth/bimanual-chore-scheduling',feed:FEED,terms:'The repository is public on GitHub. https://github.com/JWilksBooth/bimanual-chore-scheduling',stats:{format:{name:'Format reward',unit:'score',better:'higher'},feasibility:{name:'Feasibility reward',unit:'score',better:'higher'}},async fetch(){const t=await fetchText(FEED);const sec=t.split('## Baselines')[1]?.split('\n## ')[0];const rows=[...(sec??'').matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|/gm)].map(([,model,score,format,feasibility])=>({model,score:Number(score),metrics:{format:Number(format),feasibility:Number(feasibility)}}));if(rows.length<2)throw new Error('README model table missing');return checked(rows,2)}};export default board;

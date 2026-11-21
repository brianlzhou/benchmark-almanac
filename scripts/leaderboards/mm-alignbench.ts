// Headline win rate, percent. Reward remains a metric.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://huggingface.co/datasets/PhoenixZ/MM-AlignBench/raw/main/README.md";
const board:Leaderboard={benchmark:"mm-alignbench",url:FEED,feed:FEED,stats:{reward:{name:'Reward',unit:'score',better:'higher'}},
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=markdownTables(await fetchText(FEED));const out:LeaderboardRow[]=[];
const t=ts.find(t=>t[0]?.includes('Win Rate'));if(!t)throw new Error('Results missing');
 for(const c of t.slice(1))out.push({model:c[0],score:Number(c[1]),metrics:{reward:Number(c[2])}});
 return checked(out,3);
 }};export default board;

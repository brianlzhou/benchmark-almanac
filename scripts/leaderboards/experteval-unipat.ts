// ExpertEval measures expert-rubric scores across medicine, finance and law.
// The headline is the English Expert Score in UniPat's primary model ranking.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
const URL='https://unipat.ai/blog/ExpertEval';
const board:Leaderboard={benchmark:'experteval-unipat',url:URL,feed:URL,terms:'Public UniPat results. Attribution and source licensing apply.',async fetch(){const s=await fetchText(URL);const start=s.indexOf('<!-- Model Ranking -->'); const end=s.indexOf('<div class="ex-bar-legend"',start); const block=start>=0&&end>start?s.slice(start,end):'';if(!block)throw new Error('ExpertEval ranking missing');const rows:LeaderboardRow[]=[];for(const m of block.matchAll(/title="([^"]+)"[^>]*>([^<]+)<\/span>[\s\S]*?<span class="ex-bar-value">([\d.]+)/g)){const label=m[1];const setting=label.includes('(SFT')?label.match(/\(([^)]+)\)/)?.[1]:undefined;const model=label.startsWith('Qwen3.5')?'Qwen3.5-35B-A3B':label;rows.push({model,score:Number(m[3]),setting});}if(rows.length<5)throw new Error('ExpertEval rows missing');return rows;}};export default board;

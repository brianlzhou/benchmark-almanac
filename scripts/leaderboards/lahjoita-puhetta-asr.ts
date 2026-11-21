// Lahjoita puhetta tests recognition of colloquial Finnish speech. Table 5 reports word and character error rates.
// The headline is the word error rate on the official test set. Lower rates are better.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2203.12906';
const board:Leaderboard={
  benchmark:'lahjoita-puhetta-asr',static:'paper',feed,url:feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  parts:{testCER:'Test CER',devWER:'Dev WER',devCER:'Dev CER'},
  async fetch(){
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.[4]==='Test set' && t[1]?.join('|')==='Training set|System details|WER|CER|WER|CER');
    if(!t) throw Error('Missing test-set error rates');
    const rows:LeaderboardRow[]=[];
    let base='';
    for(const r of t.slice(2)){
      const inherited=r[1].startsWith('+');
      const external=r[1].includes('ext. LM data');
      if(!inherited) base=r[1].split(' + ext. LM data')[0].replace(' (no LM)','');
      const nums=r.slice(2).map(s=>s.trim()?Number(s):NaN);
      if(!base || nums.length!==4 || !nums.every(Number.isFinite)) throw Error('Invalid speech recognition result');
      const setting=r[0]+' training'+(external?', external language model data':r[1].includes('no LM')?', no language model':'');
      rows.push({model:base,setting,score:nums[2],metrics:{devWER:nums[0],devCER:nums[1],testCER:nums[3]}});
    }
    return checked(rows,12);
  },
};
export default board;

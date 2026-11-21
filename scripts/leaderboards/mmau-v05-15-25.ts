// MMAU v05.15.25. The MMAU homepage builds its "Leaderboard: MMAU-v05.15.25" table from
// leaderboard_data_v15_parsed.json, the makers' own runs with outputs parsed to one format. Avg on
// test-mini is the score, read through mmauRows in mmau.ts. The page's second v05.15.25 table
// (leaderboard_data_v15.json) holds community-reported results the makers have not checked and is not read.
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MMAU_ALIASES, MMAU_PAGE, MMAU_TERMS } from './mmau.ts';

const board: Leaderboard = {
  benchmark: 'mmau-v05-15-25',
  parts: {
    Avg_Test: { name: 'Test', group: 'Split' },
    'Sound_Test-mini': { name: 'Sound test-mini', group: 'Category' },
    Sound_Test: { name: 'Sound test', group: 'Category' },
    'Music_Test-mini': { name: 'Music test-mini', group: 'Category' },
    Music_Test: { name: 'Music test', group: 'Category' },
    'Speech_Test-mini': { name: 'Speech test-mini', group: 'Category' },
    Speech_Test: { name: 'Speech test', group: 'Category' },
    'Avg_Test-mini': { name: 'Average test mini', group: 'Split' },
  },
  url: MMAU_PAGE,
  feed: `${MMAU_PAGE}leaderboard_data_v15_parsed.json (Avg, test-mini)`,
  terms: MMAU_TERMS,
  aliases: MMAU_ALIASES,
  async fetch() {
    const data=await fetchJson<{leaderboardData:{info:{name:string,type:string,size:string,link?:string},Avg:Record<string,string>,Sound:Record<string,string>,Music:Record<string,string>,Speech:Record<string,string>}[]}>(MMAU_PAGE+'leaderboard_data_v15_parsed.json');
    const rows:LeaderboardRow[]=[];
    for(const e of data.leaderboardData){
      if(['random_guess','human_expert'].includes(e.info.type))continue;
      const score=num(e.Avg?.['Test-mini']);if(score===undefined)continue;
      let model=e.info.name.trim();
      if(model==='Qwen2-Audio')model+=' (base)';
      if(/^Gemma 3n$/i.test(model))model=`Gemma 3n E${e.info.size}`;
      if(/^Gemini 2\.[05] (?:Pro|Flash|Flash Lite)$/i.test(model) || /^GPT-4o(?: mini)? Audio$/i.test(model))model+=' (snapshot unspecified)';
      const metrics:Record<string,number>={};
      for(const key of ['Avg','Sound','Music','Speech'] as const)for(const split of ['Test-mini','Test']){const n=num(e[key]?.[split]);if(n!==undefined)metrics[`${key}_${split}`]=n;}
      rows.push({open: ['open_source','open_access','open'].includes(e.info.type ?? '') ? true : ['closed','proprietary'].includes(e.info.type ?? '') ? false : undefined, params: /^(\d+(?:\.\d+)?)[BM]$/i.test(e.info.size ?? '') && !/^Gemma 3n$/i.test(e.info.name.trim()) ? parseFloat(e.info.size!) * (/M$/i.test(e.info.size!) ? 0.001 : 1) : undefined, link: e.info.link?.startsWith('https://github.com/') ? e.info.link : undefined, model,score,metrics});
    }
    return rows;
  },
};
export default board;

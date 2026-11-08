// TVQA reports public-test accuracy in percent, separately with and without timestamp localization.
// Keep validation accuracy and TV-series test accuracies as metrics. Exclude human and random references.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const BASE='https://nlp.cs.unc.edu/data/jielei/tvqa/tvqa_public_html/files/';
const board:Leaderboard={benchmark:'tvqa',url:'https://tvqa.cs.unc.edu/',feed:BASE+'leaderboard_data_without_ts.json',terms:'Public UNC TVQA leaderboard data, subject to the dataset and site terms.',async fetch(){
  const rows:LeaderboardRow[]=[];
  for(const split of ['without_ts','with_ts']) {
    const {data}=await fetchJson<{data:Array<{model_name:string;test_public_acc:string|number;val_acc:string|number;date?:string;test_public_additional?:Record<string,[number,number]>}>}>(BASE+`leaderboard_data_${split}.json`);
    for(const r of data){if(/^(Human Performance|Random)$/.test(r.model_name))continue;
      const score=num(String(r.test_public_acc));if(score===undefined)continue;
      const val=num(String(r.val_acc));const metrics:Record<string,number>={};if(val!==undefined)metrics.validationAccuracy=val;
      for(const [key,value] of Object.entries(r.test_public_additional??{}))if(key!=='overall')metrics[key]=value[0];
      rows.push({model:r.model_name,score,setting:split==='with_ts'?'with timestamp':'without timestamp',date:r.date?.slice(0,10),metrics});
    }
  }
  if(!rows.length)throw new Error('No TVQA results');return rows;
}};
export default board;

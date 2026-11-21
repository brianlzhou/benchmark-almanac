// iSAID tests instance segmentation in aerial images. Table 2 gives test-set mask average precision.
// Table 4 breaks mask average precision down by object class for four of the five models.
import type { Leaderboard } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/1905.12886';
const board:Leaderboard={
  benchmark:'isaid',static:'paper',url:feed,feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  stats:{AP:{name:'Average precision',unit:'%',better:'higher'}},
  async fetch(){
    const gs=paperTables(await paperHtml(feed)).map(grid);
    const overall=gs.find(t=>t[0]?.join('|')==='Method|AP|AP_{50}|AP_{75}|AP_{S}|AP_{M}|AP_{L}');
    const classes=gs.find(t=>t[0]?.slice(0,4).join('|')==='Method|AP|AP_{50}|Plane' && t[0]?.at(-1)==='HC');
    if(!overall || !classes) throw Error('Missing mask AP tables');
    const names=['AP','AP50','AP75','Small','Medium','Large'];
    board.parts=Object.fromEntries([...names.slice(1),...classes[0].slice(3)].map(k=>[k,k]));
    return checked(overall.slice(1).map(r=>{
      const metrics:Record<string,number>={};
      function read(keys:string[],cells:string[]){
        for(const [i,key] of keys.entries()){
          if(!cells[i]?.trim() || !Number.isFinite(Number(cells[i]))) throw Error('Missing '+key+' for '+r[0]);
          metrics[key]=Number(cells[i]);
        }
      }
      read(names,r.slice(1));
      const byClass=classes.find(c=>c[0]===r[0]);
      if(byClass) read(classes[0].slice(3),byClass.slice(3));
      return {model:r[0],score:metrics.AP,metrics};
    }),5);
  },
};
export default board;

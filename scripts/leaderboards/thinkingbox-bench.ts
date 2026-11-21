// Whole-benchmark pass@1, domain scores, uncertainty, pass^20 and pass@20 and campaign resource estimates.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2608.19741';
const board:Leaderboard={benchmark:'thinkingbox-bench', static: 'paper',parts:{retail:'Retail',auto:'Auto',booking:'Booking',bank:'Bank',consulting:'Consulting'},url:URL,feed:URL,terms:PAPER_TERMS,stats:{pass20:{name:'Pass success',unit:'%',better:'higher'},passAt20:{name:'Pass',unit:'%',better:'higher'},nonePassed:{name:'Trials with no passed tasks',unit:'count'},allPassed:{name:'Trials with all tasks passed',unit:'count'},activeParams:{name:'Active parameters',unit:'billions'},messages:{name:'Messages',unit:'count',better:'lower'},toolCalls:{name:'Tool calls',unit:'count',better:'lower'},writeCalls:{name:'Write calls',unit:'count',better:'lower'},toolErrors:{name:'Tool errors',unit:'count',better:'lower'},campaignCost:{name:'Campaign cost',unit:'usd',better:'lower'},costPerSuccess:{name:'Cost per success',unit:'usd',better:'lower'},costPerAll20Task:{name:'Cost per all-20-task run',unit:'usd',better:'lower'},maxOutputTokens:{name:'Maximum output tokens',unit:'tokens'},timeoutSeconds:{name:'Timeout',unit:'seconds',better:'lower'},retailTokensPerTurn:{name:'Retail tokens per turn',unit:'tokens'},retailTurns:{name:'Retail turns',unit:'count'},bookingTokensPerTurn:{name:'Travel tokens per turn',unit:'tokens'},bookingTurns:{name:'Booking turns',unit:'count'},autoTokensPerTurn:{name:'Auto insurance tokens per turn',unit:'tokens'},autoTurns:{name:'Auto insurance turns',unit:'count'},bankTokensPerTurn:{name:'Neobank internal IT tokens per turn',unit:'tokens'},bankTurns:{name:'Neobank turns',unit:'count'},consultingTokensPerTurn:{name:'Consulting IT/HR tokens per turn',unit:'tokens'},consultingTurns:{name:'Consulting turns',unit:'count'},priceIn:{name:'Input token price per million',unit:'usd-per-mtok',better:'lower'},priceOut:{name:'Output token price per million',unit:'usd-per-mtok',better:'lower'},priceCacheRead:{name:'Cache-read price per million',unit:'usd-per-mtok',better:'lower'},priceCacheWrite:{name:'Cache-write price per million',unit:'usd-per-mtok',better:'lower'}},
 async fetch(){const tables=paperTables(await paperHtml(URL)).map(grid);const t=tables.find(t=>t[0]?.[1]==='pass@1 (%)' && t[0]?.[3]==='pass@20 (%)');if(!t)throw new Error('Reviewed results missing');const out:LeaderboardRow[]=[];
 const domain=tables.find(t=>t[0][1]==='Size');
 const calls=tables.find(t=>t[0][1]==='Avg. msgs. / trial');
 const costs=tables.find(t=>t[0][2]?.includes('Rates:'));
 const config=tables.find(t=>t[0][0]==='Parameter' && t[0][1]==='Agent');
 const tokenTable=tables.find(t=>t[0][1]==='Retail' && t[0][2]==='Travel');
 for(const c of t.slice(1)){
   const model=c[0],i=domain?.findIndex(r=>r[0]===model) ?? -1;
   const sub=domain?.[i], group=domain?.slice(0,i).reverse().find(r=>r[0]===r[1])?.[0];
   const use=calls?.find(r=>r[0]===model), price=costs?.find(r=>r[1]===model);
   const ci=c[1].match(/\[([\d.]+),\s*([\d.]+)\]/);
   const size=sub?.[1].match(/^([\d.]+)([TB])(?:\/([\d.]+)B)?$/);
   const metrics:Record<string,number>={pass20:parseFloat(c[2]),passAt20:parseFloat(c[3]),nonePassed:Number(c[4]),allPassed:Number(c[5])};
   if(sub)['retail','auto','booking','bank','consulting'].forEach((key,j)=>{metrics[key]=parseFloat(sub[j+2]);});
   if(size?.[3])metrics.activeParams=Number(size[3]);
   if(use)['messages','toolCalls','writeCalls','toolErrors'].forEach((key,j)=>{metrics[key]=Number(use[j+1]);});
   const tokens=tokenTable?.find(r=>r[0]===model);
   if(tokens) ['retail','booking','auto','bank','consulting'].forEach((key,j)=>{
     const ns=tokens[j+1].match(/[\d.]+/g);
     if(ns?.length===2){metrics[key+'TokensPerTurn']=Number(ns[0])*1000;metrics[key+'Turns']=Number(ns[1]);}
   });
   if(price){
     price[2].split('/').forEach((v,j)=>{if(/\d/.test(v))metrics[['priceIn','priceOut','priceCacheRead','priceCacheWrite'][j]]=parseFloat(v);});
     for(const [j,key] of ['campaignCost','costPerSuccess','costPerAll20Task'].entries()){
       const value=parseFloat(price[6+j].replace(/[$,]/g,''));if(Number.isFinite(value))metrics[key]=value;
     }
   }
   for(const [column,key] of [['max_completion_tokens','maxOutputTokens'],['timeout (seconds)','timeoutSeconds']]){
     const v=config?.find(r=>r[0]===column)?.[1];if(v)metrics[key]=Number(v);
   }
   const effort=config?.find(r=>r[0]==='reasoning_effort')?.[1];
   out.push({model,score:parseFloat(c[1]),harness:'Thinkingbox',setting:['507 tasks','20 trials',effort].filter(Boolean).join('; '),
     trials:20,low:ci?Number(ci[1]):undefined,high:ci?Number(ci[2]):undefined,cost:metrics.campaignCost===undefined?undefined:metrics.campaignCost/(507*20),
     params:size?Number(size[1])*(size[2]==='T'?1000:1):undefined,open:group==='Open-weights models'?true:group==='Proprietary models'?false:undefined,metrics});
 }return checked(out,3);
 }};export default board;

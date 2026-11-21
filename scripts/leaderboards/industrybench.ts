// IndustryBench tests Chinese industrial procurement knowledge. The paper ranks by a safety-adjusted mean on a 0 to 3 scale.
// The headline and its confidence limits express that mean as a percentage of the maximum score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.10267';
const capabilities=['Standards & Terminology','Process Principles','Selection & Substitution','Safety & Compliance','Quality & Metrology','Fault Diagnosis','Engineering Calculation'];
const industries=['Machinery & Hardware','Chemical & Coatings','Electronics & Sensors','Electrical & Power','Cross-industry','Metallurgy & Mining','Energy','Security & Fire Safety','Packaging & Printing','Textile & Leather'];
const languages=['Chinese','English','Russian','Vietnamese'];
const board: Leaderboard = {
  benchmark: 'industrybench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2605.10267",
  aliases:{'Kimi-k2.5-1T-A32B':'kimi-k2-5','GLM-5-744B-A40B':'glm-5','MiniMax-M2.5-230B-A10B':'minimax-m2-5'},
  stats:{rawMean:{name:'Raw mean',unit:'score',better:'higher',note:'Mean score before safety adjustment on a 0 to 3 scale.'},perfect:{name:'Perfect answer rate',unit:'%',better:'higher'},pass:{name:'Pass rate',unit:'%',better:'higher'}},
  parts:Object.fromEntries([...capabilities,...industries,...languages].map(name=>[name,{name,unit:'%' as const}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const find=(k:string)=>{const t=tables.find(t=>t[0]?.includes(k));if(!t)throw new Error('Missing IndustryBench column '+k);return t;};
    const leaderboard=find('Delta').find(r=>r[0]==='Rank' && r.at(-1)?.startsWith('Final (SV)'));
    if(!leaderboard) throw new Error('Missing safety-adjusted ranking');
    const main=tables.find(t=>t[0]===leaderboard)!;
    const ci=find('95% CI half-width'), think=find('Think Final'), cap=find('S&T'), ind=find('Mach.'), lang=find('VI');
    const pct=(s:string)=>numberCell(s)*100/3;
    const rows:LeaderboardRow[]=[];
    for(const [rank,model,perfect,pass,raw,,final] of main.slice(1)){
      if(!/^\d+$/.test(rank)) continue;
      const interval=ci.find(r=>r[1]===model);
      if(!interval || interval[2]!==final) throw new Error('Missing score interval: '+model);
      const width=Number(interval[3].match(/\d+\.\d+$/)?.[0]);
      if(!Number.isFinite(width)) throw new Error('Invalid interval');
      const metrics:Record<string,number>={rawMean:numberCell(raw),perfect:Number(perfect.replace('%','')),pass:Number(pass.replace('%',''))};
      for(const [table,labels] of [[cap,capabilities],[ind,industries],[lang,languages]] as const){
        const r=table.find(r=>r[0]===model);
        if(!r && table===lang)continue;
        if(!r)throw new Error('Missing subgroup scores: '+model);
        labels.forEach((k,i)=>{metrics[k]=pct(r[i+1]);});
      }
      const score=pct(final);
      rows.push({model,setting:'Non-thinking',score,low:score-100*width/3,high:score+100*width/3,metrics});
    }
    for(const [model,,final] of think.slice(1))rows.push({model,setting:'Thinking',score:pct(final)});
    return checked(rows,30);
  },
};
export default board;

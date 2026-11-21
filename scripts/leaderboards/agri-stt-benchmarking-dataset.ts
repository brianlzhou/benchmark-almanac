// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The benchmark evaluates transcription of farmers’ speech. Tables IV to VI rank systems by word error rate.
// Table VII also reports full-transcript scores for two systems with complete three-language coverage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url='https://arxiv.org/html/2602.03868';
const languages=['Hindi','Telugu','Odia'];
const labels=['WER','CER','MER','AWWER'];
const board:Leaderboard={
  benchmark:'agri-stt-benchmarking-dataset',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The paper reports no overall word error rate, so this is the plain mean for Hindi, Telugu and Odia.',
  parts:Object.fromEntries(languages.flatMap(group=>labels.map(name=>[group+name,{name,group,unit:'%',better:'lower'}]))),
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const ranks=ts.filter(t=>t[0]?.join('|')==='Rank|Model|WER|CER|MER|AWWER');
    const full=ts.find(t=>t[0]?.join('|')==='Model|Lang.|Full WER|BS WER|Improv.|Avg. Spk.|Multi-Spk.%');
    if(ranks.length!==3 || !full) throw new Error('Missing language or diarization table');
    const systems=new Map<string,LeaderboardRow>();
    function add(model:string,setting:string,language:string,values:string[]) {
      const key=model+'|'+setting;
      const row=systems.get(key)??{model,setting,score:NaN,metrics:{}};
      values.forEach((v,i)=>{
        if (!/^\d+(?:\.\d+)?%$/.test(v)) throw new Error('Invalid error rate');
        const k=language+labels[i];
        if (k in row.metrics!) throw new Error('Duplicate language result');
        row.metrics![k]=parseFloat(v);
      });
      systems.set(key,row);
    }
    ranks.forEach((table,i)=>{
      if(table.length!==[11,8,8][i]) throw new Error('Language ranking changed');
      for(const [,label,...values] of table.slice(1)){
        add(label.replace(/ \(BS\)$/,''),label.endsWith('(BS)')?'Best speaker':'Full transcript',languages[i],values);
      }
    });
    for(const [model,language,wer] of full.slice(1)) add(model,'Full transcript',language,[wer]);
    const rows=[...systems.values()].filter(r=>languages.every(l=>l+'WER' in r.metrics!));
    for(const row of rows) row.score=languages.reduce((sum,l)=>sum+row.metrics![l+'WER'],0)/3;
    return checked(rows,7);
  },
};
export default board;

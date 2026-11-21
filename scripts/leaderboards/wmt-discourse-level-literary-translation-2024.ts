// WMT 2024 evaluates literary translation from Chinese. English has human ratings and automatic
// metrics, while German and Russian have document BLEU. Table 5 ranks on General and Discourse
// separately. Use the first human rating and join the primary submissions in Tables 3 and 4.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2412.11732';
const systems: Record<string,{model:string;models?:string[]}> = {
  Cloudsheep:{model:'Google Translate + GPT-3.5-turbo + GPT-4',models:['Google Translate','GPT-3.5-turbo','GPT-4']},
  'HW-TSC':{model:'Chinese-Llama2'},
  'NLP2CT-UM':{model:'GPT-4o'},
  NTU:{model:'Phi 3'},
  'SJTU-LoveFiction':{model:'Qwen2-72B + Claude3.5 + GPT-4o',models:['Qwen2-72B','Claude3.5','GPT-4o']},
};
const english = ['BLEU','chrF2','COMET','TER','dBLEU'];
const board: Leaderboard = {
  benchmark:'wmt-discourse-level-literary-translation-2024',static:'paper',url,feed:url,terms:PAPER_TERMS,
  headline:'The headline is the General human rating for Chinese-to-English translation, the first ranking in Table 5.',
  parts:{general:{name:'General',unit:'rating'},discourse:{name:'Discourse',unit:'rating'},
    ...Object.fromEntries(english.map(k=>[k,{name:k==='dBLEU'?'d-BLEU':k,group:'Zh-En',unit:'score',better:k==='TER'?'lower':'higher'}])),
    de:{name:'Zh-De d-BLEU',unit:'score'},ru:{name:'Zh-Ru d-BLEU',unit:'score'}},
  async fetch() {
    const ts = paperTables(await paperHtml(url)).map(grid);
    const human = ts.find(t=>t[0].join('|')==='System|General|Discourse|Rank');
    const en = ts.find(t=>t[1]?.join('|')==='Type|System|BLEU ↑|chrF2 ↑|COMET ↑|TER ↓|d-BLEU ↑');
    const other = ts.find(t=>t[1]?.join('|')==='System|Zh-De|Zh-Ru');
    if (!human || !en || !other) throw new Error('Missing results table');
    const team = (s:string)=>s.replace(/[⋆\s]/g,'');
    const rows = human.slice(1).map(([id,g,d])=>{
      const system = systems[id];
      const values = en.find(r=>r[0]==='Primary' && team(r[1])===id);
      if (!system || !values) throw new Error('Unknown primary system '+id);
      const metrics:Record<string,number> = {general:Number(g),discourse:Number(d)};
      english.forEach((k,i)=>metrics[k]=Number(values[i+2]));
      const pair = other.find(r=>team(r[0])===id);
      if (pair) { metrics.de=Number(pair[1]); metrics.ru=Number(pair[2]); }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid primary score');
      return {...system,submitter:id,harness:id,score:metrics.general,metrics};
    });
    return checked(rows,5);
  },
};
export default board;

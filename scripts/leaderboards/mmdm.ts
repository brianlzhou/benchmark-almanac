// MMDM evaluates decisions over large option sets. Its leaderboard lists Hard Single-select accuracy first.
// The native JSON holds hard accuracies as fractions and soft-label error as a lower-is-better Brier score.
// The leaderboard marks partial coverage. Preserve its item counts for the main tracks and category breakdowns.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed='https://mmdm-benchmark.github.io/';
const names={single:'Hard Single-select',set:'Hard Multi-select',soft:'Soft Brier'};
type Measure=keyof typeof names;
type Scores=Record<Measure,number|null> & Record<string,number|null>;
interface Model {id:string;name:string;metrics:Scores;categories:Record<string,Scores>;metadata:{parameters_b:number|null}}
const board:Leaderboard={
  benchmark:'mmdm',url:feed+'#leaderboard',feed,
  terms:'The authors publish the MMDM leaderboard and protocol at https://mmdm-benchmark.github.io/.',
  async fetch(){
    const data=jsonAfter<{single:number;categories:{id:string,name:string}[];models:Model[]}>(await fetchText(feed),'<script id="benchmark-data" type="application/json">');
    const parts:Record<string,BoardPart>={};
    const rows=data.models.filter(m=>m.id!=='random').map(m=>{
      const metrics:Record<string,number>={};
      function add(scores:Scores,prefix:string,group:string){
        for(const k of Object.keys(names) as Measure[]){
          const v=scores[k], key=prefix+k;
          if(v===null)continue;
          if(typeof v!=='number' || !Number.isFinite(v))throw new Error('Missing track score for '+m.name);
          metrics[key]=k==='soft'?v:v*100;
          const count=scores[k+'_n'];
          if(typeof count!=='number')throw new Error('Missing track coverage');
          metrics[key+'Count']=count;
          parts[key]={name:prefix?group+': '+names[k]:names[k],group,unit:k==='soft'?'brier':'%',better:k==='soft'?'lower':'higher'};
        }
      }
      add(m.metrics,'','Track');
      for(const cat of data.categories)if(m.categories[cat.id])add(m.categories[cat.id],cat.id+'_',cat.name);
      if(!Number.isFinite(metrics.single))throw new Error('Missing headline accuracy');
      return {model:m.name,score:metrics.single,metrics,params:m.metadata.parameters_b??undefined,
        setting:metrics.singleCount<data.single?'Partial coverage ('+metrics.singleCount+' of '+data.single+' single-select items)':undefined};
    });
    board.parts=parts;
    return checked(rows,36);
  },
};
export default board;

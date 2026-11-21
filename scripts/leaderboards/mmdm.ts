// MMDM evaluates decisions over large option sets. Its leaderboard lists Hard Single-select accuracy first.
// The native JSON holds hard accuracies as fractions and soft-label error as a lower-is-better Brier score.
// The leaderboard marks partial coverage. Preserve its item counts for the main tracks and category breakdowns.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed='https://mmdm-benchmark.github.io/';
const names={single:'Hard Single-select',set:'Hard Multi-select',soft:'Soft Brier'};
const countStats = {
  singleCount: 'Hard single-select items', setCount: 'Hard multi-select items', softCount: 'Soft Brier items',
  world_knowledge_singleCount: 'World knowledge single-select items', reading_comprehension_singleCount: 'Reading comprehension single-select items', reading_comprehension_setCount: 'Reading comprehension multi-select items',
  deductive_reasoning_singleCount: 'Deductive reasoning single-select items', option_logic_singleCount: 'Option logic single-select items', option_logic_setCount: 'Option logic multi-select items',
  constraint_planning_singleCount: 'Constraint planning single-select items', constraint_planning_setCount: 'Constraint planning multi-select items', quantitative_temporal_reasoning_singleCount: 'Quantitative temporal reasoning single-select items', quantitative_temporal_reasoning_softCount: 'Quantitative temporal reasoning Brier items',
  workflow_decision_singleCount: 'Workflow decision single-select items', workflow_decision_setCount: 'Workflow decision multi-select items', agent_state_tracking_singleCount: 'Agent state tracking single-select items', policy_exception_singleCount: 'Policy exception single-select items', policy_exception_softCount: 'Policy exception Brier items',
  evidence_validation_singleCount: 'Evidence validation single-select items', evidence_validation_softCount: 'Evidence validation Brier items', code_database_singleCount: 'Code database single-select items', intent_routing_singleCount: 'Intent routing single-select items', tool_skill_selection_singleCount: 'Tool skill selection single-select items', tool_skill_selection_setCount: 'Tool skill selection multi-select items', tool_skill_selection_softCount: 'Tool skill selection Brier items',
  answer_preference_singleCount: 'Answer preference single-select items', score_rubric_singleCount: 'Score rubric single-select items', score_rubric_softCount: 'Score rubric Brier items', emotion_recognition_singleCount: 'Emotion recognition single-select items',
};
type Measure=keyof typeof names;
type Scores=Record<Measure,number|null> & Record<string,number|null>;
interface Model {id:string;name:string;metrics:Scores;categories:Record<string,Scores>;metadata:{parameters_b:number|null}}
const board:Leaderboard={
  benchmark:'mmdm',url:feed+'#leaderboard',feed,
  terms:'The authors publish the MMDM leaderboard and protocol at https://mmdm-benchmark.github.io/.',
  stats: Object.fromEntries(Object.entries(countStats).map(([key, name]) => [key, { name, unit: 'count' }])),
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

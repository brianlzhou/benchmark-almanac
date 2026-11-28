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
const mmdmParts: Record<string, BoardPart> = {
  single: { name: 'Hard Single-select', group: 'Track', unit: '%', better: 'higher' },
  set: { name: 'Hard Multi-select', group: 'Track', unit: '%', better: 'higher' },
  soft: { name: 'Soft Brier', group: 'Track', unit: 'brier', better: 'lower' },
  world_knowledge_single: { name: 'World knowledge: Hard Single-select', group: 'World knowledge', unit: '%', better: 'higher' },
  reading_comprehension_single: { name: 'Reading comprehension: Hard Single-select', group: 'Reading comprehension', unit: '%', better: 'higher' },
  reading_comprehension_set: { name: 'Reading comprehension: Hard Multi-select', group: 'Reading comprehension', unit: '%', better: 'higher' },
  deductive_reasoning_single: { name: 'Deductive reasoning: Hard Single-select', group: 'Deductive reasoning', unit: '%', better: 'higher' },
  option_logic_single: { name: 'Option logic: Hard Single-select', group: 'Option logic', unit: '%', better: 'higher' },
  option_logic_set: { name: 'Option logic: Hard Multi-select', group: 'Option logic', unit: '%', better: 'higher' },
  constraint_planning_single: { name: 'Constraint planning: Hard Single-select', group: 'Constraint planning', unit: '%', better: 'higher' },
  constraint_planning_set: { name: 'Constraint planning: Hard Multi-select', group: 'Constraint planning', unit: '%', better: 'higher' },
  constraint_planning_soft: { name: 'Constraint planning: Soft Brier', group: 'Constraint planning', unit: 'brier', better: 'lower' },
  quantitative_temporal_reasoning_single: { name: 'Quantitative & temporal reasoning: Hard Single-select', group: 'Quantitative & temporal reasoning', unit: '%', better: 'higher' },
  quantitative_temporal_reasoning_soft: { name: 'Quantitative & temporal reasoning: Soft Brier', group: 'Quantitative & temporal reasoning', unit: 'brier', better: 'lower' },
  workflow_decision_single: { name: 'Workflow decision: Hard Single-select', group: 'Workflow decision', unit: '%', better: 'higher' },
  workflow_decision_set: { name: 'Workflow decision: Hard Multi-select', group: 'Workflow decision', unit: '%', better: 'higher' },
  agent_state_tracking_single: { name: 'Agent state tracking: Hard Single-select', group: 'Agent state tracking', unit: '%', better: 'higher' },
  policy_exception_single: { name: 'Policies & exceptions: Hard Single-select', group: 'Policies & exceptions', unit: '%', better: 'higher' },
  policy_exception_soft: { name: 'Policies & exceptions: Soft Brier', group: 'Policies & exceptions', unit: 'brier', better: 'lower' },
  evidence_validation_single: { name: 'Evidence validation: Hard Single-select', group: 'Evidence validation', unit: '%', better: 'higher' },
  evidence_validation_soft: { name: 'Evidence validation: Soft Brier', group: 'Evidence validation', unit: 'brier', better: 'lower' },
  code_database_single: { name: 'Code & databases: Hard Single-select', group: 'Code & databases', unit: '%', better: 'higher' },
  intent_routing_single: { name: 'Intent routing: Hard Single-select', group: 'Intent routing', unit: '%', better: 'higher' },
  tool_skill_selection_single: { name: 'Tool & skill selection: Hard Single-select', group: 'Tool & skill selection', unit: '%', better: 'higher' },
  tool_skill_selection_set: { name: 'Tool & skill selection: Hard Multi-select', group: 'Tool & skill selection', unit: '%', better: 'higher' },
  tool_skill_selection_soft: { name: 'Tool & skill selection: Soft Brier', group: 'Tool & skill selection', unit: 'brier', better: 'lower' },
  answer_preference_single: { name: 'Answer preference: Hard Single-select', group: 'Answer preference', unit: '%', better: 'higher' },
  score_rubric_single: { name: 'Score & rubrics: Hard Single-select', group: 'Score & rubrics', unit: '%', better: 'higher' },
  score_rubric_soft: { name: 'Score & rubrics: Soft Brier', group: 'Score & rubrics', unit: 'brier', better: 'lower' },
  emotion_recognition_single: { name: 'Emotion recognition: Hard Single-select', group: 'Emotion recognition', unit: '%', better: 'higher' },
};
type Scores=Record<Measure,number|null> & Record<string,number|null>;
interface Model {id:string;name:string;metrics:Scores;categories:Record<string,Scores>;metadata:{parameters_b:number|null}}
const board:Leaderboard={
  benchmark:'mmdm',url:feed+'#leaderboard',feed,
  terms:'The authors publish the MMDM leaderboard and protocol at https://mmdm-benchmark.github.io/.',
  parts: mmdmParts,
  stats: {
    singleCount: { name: 'Hard single-select items', unit: 'count' },
    softCount: { name: 'Soft Brier items', unit: 'count' },
  },
  async fetch(){
    const data=jsonAfter<{single:number;categories:{id:string,name:string}[];models:Model[]}>(await fetchText(feed),'<script id="benchmark-data" type="application/json">');
    const rows=data.models.filter(m=>m.id!=='random').map(m=>{
      const metrics:Record<string,number>={};
      function add(scores:Scores,prefix:string){
        for(const k of Object.keys(names) as Measure[]){
          const v=scores[k], key=prefix+k;
          if(v===null)continue;
          if(typeof v!=='number' || !Number.isFinite(v))throw new Error('Missing track score for '+m.name);
          metrics[key]=k==='soft'?v:v*100;
          if(!prefix && (k==='single' || k==='soft')){
            const count=scores[k+'_n'];
            if(typeof count!=='number')throw new Error('Missing track coverage');
            metrics[key+'Count']=count;
          }
        }
      }
      add(m.metrics,'');
      for(const cat of data.categories)if(m.categories[cat.id])add(m.categories[cat.id],cat.id+'_');
      if(!Number.isFinite(metrics.single))throw new Error('Missing headline accuracy');
      return {model:m.name,score:metrics.single,metrics,params:m.metadata.parameters_b??undefined,
        setting:metrics.singleCount<data.single?'Partial coverage ('+metrics.singleCount+' of '+data.single+' single-select items)':undefined};
    });
    return checked(rows,36);
  },
};
export default board;

// LevelBench v5 ranks accounting runs by raw accuracy across four task areas. Each run names its evaluation cohort.
// The versioned leaderboard preserves unassisted runs, output limits and Level Playbooks as distinct configurations.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/LevelCFO/levelbench-100/resolve/a1a9823804428d2a436823dfbfdacbc1e7ce930c/leaderboard.json";
const areas = {area1_bookkeeping_pct:'Bookkeeping',area2_accrual_close_pct:'Accrual Close',area3_cfo_analysis_pct:'CFO Analysis',area4_deliverables_pct:'Deliverables'};
interface Entry {
  name:string; kind:string; architecture_tier:string; cohort_label:string; zero_shot_raw_accuracy_pct:number;
  estimated_cost_per_task_usd:number; median_p50_task_seconds:number; [key:string]:string|number|null;
}

const board: Leaderboard = {
  benchmark: "levelbench-100-5",
  url: "https://levelcfo.com/benchmarks/agentic-accounting/#leaderboard-explorer",
  feed,
  terms: "Rows use 372, 924, or 5,923 checks. Keep cohorts and operator assistance separate. Level permits attributed citation. Commercial redistribution requires a written license. https://levelcfo.com/data/benchmarks/cases/LICENSE_AND_IP_NOTICE.txt Hugging Face permits the aggregate feed. Level excludes its API from crawling.",
  parts: areas, harnesses:'system',
  stats: { medianLatency:{name:'Median task latency',unit:'seconds',better:'lower'}, worlds_evaluated:{name:'Worlds evaluated',unit:'count'}, tasks_evaluated:{name:'Tasks evaluated',unit:'count'}, criteria_evaluated:{name:'Criteria evaluated',unit:'count'}, rule_guided_prompt_accuracy_pct:{name:'Rule guided prompt accuracy',unit:'%',better:'higher'}, completeOutputPct:{name:'Complete output rate',unit:'%',better:'higher'}, bad_book_entry_rate_pct:{name:'Bad book entry rate',unit:'%',better:'lower'}, numerical_footing_pct:{name:'Numerical footing',unit:'%',better:'higher'}, gaap_accrual_precision_pct:{name:'Generally accepted accounting principles accrual precision',unit:'%',better:'higher'}, epistemic_safety_pct:{name:'Epistemic safety',unit:'%',better:'higher'}, double_entry_integrity_pct:{name:'Double entry integrity',unit:'%',better:'higher'}, brand_deliverable_governance_pct:{name:'Brand deliverable governance',unit:'%',better:'higher'}, dp_lift_accuracy_pct:{name:'Double-entry bookkeeping lift accuracy',unit:'%',better:'higher'}, dp_lift_consistency_pct:{name:'Double-entry bookkeeping lift consistency',unit:'%',better:'higher'}, pareto_score:{name:'Pareto score',unit:'score',better:'higher'} },
  chart: {
    title: 'Accounting accuracy vs. cost per task',
    x: { key: 'cost', label: 'Cost per close task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Accounting accuracy', unit: '%', better: 'higher' },
    note: 'LevelBench plots zero-shot accounting accuracy against estimated cost per close task.',
  },
  async fetch() {
    const records = await fetchJson<Entry[]>(feed);
    if(records.length < 68) throw new Error('Expected 68 LevelBench configurations');
    return records.map(r=>{
      if(!r.name || !r.cohort_label || !Number.isFinite(r.zero_shot_raw_accuracy_pct)) throw new Error('Missing LevelBench run identity or accuracy');
      const metrics:Record<string,number>={medianLatency:r.median_p50_task_seconds};
      for(const [key,v] of Object.entries(r)) if(typeof v === 'number' && key !== 'zero_shot_raw_accuracy_pct' && (key.endsWith('_pct') || key.endsWith('_evaluated') || key==='pareto_score')) metrics[key==='consistency_pass3_pct'?'completeOutputPct':key]=v;
      for(const key of Object.keys(areas)) if(!Number.isFinite(metrics[key])) throw new Error('Missing area '+key);
      const model=r.name.replace(/^Level Playbooks \+ /,'');
      return {model,score:r.zero_shot_raw_accuracy_pct,setting:[r.cohort_label.replace(/\s*·\s*/g,', '),r.architecture_tier,model.match(/\(([^)]+)\)/)?.[1]].filter(Boolean).join(' / '),
        harness:r.kind==='dp'?'Level Playbooks':undefined,cost:r.estimated_cost_per_task_usd,metrics};
    });
  },
};
export default board;

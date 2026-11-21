// ResearchCodeBench tests whether language models can solve research code repositories.
// The repository's checked-in overall_stats JSON supplies task-rate percentages for 20 models.
import type { Leaderboard } from './types.ts'; import { fetchJson } from '../lib/util.ts'; import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://raw.githubusercontent.com/PatrickHua/ResearchCodeBench/main/outputs/20llms_greedy/2025-05-12-17-13-20/overall_stats.json';
export default {benchmark:'researchcodebench',url:'https://github.com/PatrickHua/ResearchCodeBench',feed,terms:'Public author results. https://github.com/PatrickHua/ResearchCodeBench',async fetch(){const j:any=await fetchJson(feed);const rows=Object.values(j.overall_scores).map((v:any)=>({model:v.llm_cfg.pretty_name,score:v.task_rates.mean,metrics:{lineRate:v.line_rates.mean}}));return checked(rows,20)}} satisfies Leaderboard;

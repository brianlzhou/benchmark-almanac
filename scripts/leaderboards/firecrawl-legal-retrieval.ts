// Firecrawl's legal retrieval benchmark tests search APIs on official primary-law pages.
// The headline score is canonical@1, the percentage of queries whose first result is the official page.
// This importer reads the public results JSON published by the benchmark repository.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://raw.githubusercontent.com/firecrawl/benchmark-legal-retrieval/main/results.json';
interface Metric { value?:number; ci95_low?:number; ci95_high?:number; count?:number; repeats?:number }
interface Row { metric:string; scope:string; full?:Metric }
interface Arm { arm?:string; rows?:Row[] }
interface Data { arms?:Arm[] }
const pct=(x:number|undefined)=>x===undefined?undefined:Math.round(x*1000)/10;
const board:Leaderboard={benchmark:'firecrawl-legal-retrieval',url:'https://www.firecrawl.dev/benchmarks/legal-retrieval',feed:FEED,terms:'The repository publishes its code and data under MIT for code and CC BY 4.0 for data. Results are credited to Firecrawl with a link to the repository.',parts:{goldRecall:{name:'Gold recall@10',group:'Retrieval metrics'},canonicalMrr:{name:'Canonical MRR@10',group:'Retrieval metrics'},hitAt10:{name:'Hit@10',group:'Retrieval metrics'}},stats:{latencyP50:{name:'Latency p50',unit:'ms',better:'lower'},latencyP95:{name:'Latency p95',unit:'ms',better:'lower'}},async fetch(){const d=await fetchJson<Data>(FEED);if(!d.arms||d.arms.length<4)throw new Error('Legal retrieval: fewer than four arms');const rows:LeaderboardRow[]=[];for(const a of d.arms){const by=new Map((a.rows??[]).filter(r=>r.scope==='overall'&&r.full).map(r=>[r.metric,r.full!]));const s=by.get('canonical@1'),g=by.get('gold_recall@10'),m=by.get('canonical_mrr@10'),h=by.get('hit@10'),p50=by.get('latency_p50_ms'),p95=by.get('latency_p95_ms');if(s?.value===undefined)continue;rows.push({model:a.arm??'unknown',score:pct(s.value)!,low:pct(s.ci95_low),high:pct(s.ci95_high),trials:s.repeats,metrics:{goldRecall:pct(g?.value)??0,canonicalMrr:pct(m?.value)??0,hitAt10:pct(h?.value)??0,...(p50?.value===undefined?{}:{latencyP50:p50.value}),...(p95?.value===undefined?{}:{latencyP95:p95.value})}});}if(rows.length<4)throw new Error(`Legal retrieval: ${rows.length} rows, expected 4`);return rows;}};export default board;

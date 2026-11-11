// AIRTBench official model success rates are percentages over the released security-challenge runs.
// Provider identity is retained as harness. The 450 MB parquet/1.55 GB CSV hold per-run costs and tokens;
// those are not reported in this small aggregate table, and the dataset-server feed is unavailable.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/dreadnode/AIRTBench/resolve/main/README.md";
const board: Leaderboard = {
 benchmark: "airtbench", url: "https://huggingface.co/datasets/dreadnode/AIRTBench", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases: {'gemini-2.5-pro-preview-05-06':'gemini-2-5-pro-may-2025','gemini-2.5-flash-preview-04-17':'gemini-2-5-flash-apr-2025','llama-4-scout-17b-16e-instruct':'llama-4-scout','claude-3-7-sonnet-20250219':'claude-3-7-sonnet','qwen-qwq-32b':'qwq-32b','llama-3.3-70b-versatile':'llama-3-3-70b'},
 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Success Rate'));if(!t)throw new Error('No model success table');return t.rows.flatMap(r=>{const score=num(r[1]);if(score===undefined)return [];const parts=r[0].split('/');let model=parts.pop()!;const harness=parts.join('/')||undefined;if(['gpt-4o','gemini-1.5-pro','DeepSeek-R1'].includes(model))model+=' [snapshot unspecified]';return [{model,harness,score,setting:'Released runs; flag found'}];});
 },
};
export default board;

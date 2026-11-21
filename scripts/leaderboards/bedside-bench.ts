// Bedside Bench: Fireworks publishes Doximity's headline clinical accuracy, cost, and token metrics.
import { fireworksBoard } from '../lib/boards/fireworks.ts';
const source=fireworksBoard('bedside-bench', 'healthcare/bedside-bench');
source.stats = { cached: { name: 'Cached input tokens', unit: 'tokens' }, completion: { name: 'Completion tokens', unit: 'tokens' }, cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' }, duration_per_task: { name: 'Duration per task', unit: 'seconds', better: 'lower' }, prompt: { name: 'Prompt tokens', unit: 'tokens' } };
export default {...source,async fetch(){
 const rows=await source.fetch();
 return rows.map(row=>({...row,tokens:row.tokens??row.metrics?.completion_tokens_per_task??row.metrics?.completion}));
}};

// Bedside Bench: Fireworks publishes Doximity's headline clinical accuracy, cost, and token metrics.
import { fireworksBoard } from '../lib/boards/fireworks-cov2.ts';
const source=fireworksBoard('bedside-bench', 'healthcare/bedside-bench');
export default {...source,async fetch(){
 const rows=await source.fetch();
 return rows.map(row=>({...row,tokens:row.tokens??row.metrics?.completion_tokens_per_task??row.metrics?.completion}));
}};

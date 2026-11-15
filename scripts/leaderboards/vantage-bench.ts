// Overall score and component metrics from the official Space's results JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = "https://huggingface.co/spaces/clemson-computing/VANTAGE-Bench-Leaderboard/raw/main/data/results.json";
const board: Leaderboard = {
 benchmark: 'vantage-bench', url: "https://huggingface.co/spaces/clemson-computing/VANTAGE-Bench-Leaderboard", feed: FEED,
 terms: 'Apache-2.0 project; Hugging Face robots.txt permits this public raw results path.',
 async fetch() {
  const data = await fetchJson<{models: ({name:string;overall:number;date_evaluated:string} & Record<string,unknown>)[]}>(FEED);
  const rows = data.models.filter(r => Number.isFinite(r.overall)).map(r => ({model:r.name, score:r.overall, date:r.date_evaluated,
   metrics:Object.fromEntries(Object.entries(r).filter(([k,v]) => k !== 'overall' && typeof v === 'number')) as Record<string,number>}));
  if(rows.length < 3 || rows.some(r=>!Number.isFinite(r.score))) throw new Error('Invalid overall results');
  return rows;
 }
};
export default board;

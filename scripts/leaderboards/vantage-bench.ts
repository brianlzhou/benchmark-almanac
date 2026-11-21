// Overall score and component metrics from the official Space's results JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED = "https://huggingface.co/spaces/clemson-computing/VANTAGE-Bench-Leaderboard/raw/main/data/results.json";
const board: Leaderboard = {
 benchmark: 'vantage-bench', parts: {
  semantic: { name: 'Semantic', group: 'Dimension' },
  spatial: { name: 'Spatial', group: 'Dimension' },
  spatio_temporal: { name: 'Spatiotemporal', group: 'Dimension' },
  temporal: { name: 'Temporal', group: 'Dimension' },
  '2d_localization': { name: '2D localization', group: 'Task type' },
  '2d_referring_expressions': { name: '2D referring expressions', group: 'Task type' },
  '2d_spatial_pointing': { name: '2D spatial pointing', group: 'Task type' },
  single_object_tracking: { name: 'Single object tracking', group: 'Task type' },
  temporal_localization: { name: 'Temporal localization', group: 'Task type' },
  dense_video_captioning: { name: 'Dense video captioning', group: 'Task type' },
  event_verification: { name: 'Event verification', group: 'Task type' },
  video_qa: { name: 'Video QA', group: 'Task type' },
}, url: "https://huggingface.co/spaces/clemson-computing/VANTAGE-Bench-Leaderboard", feed: FEED,
 terms: 'Apache-2.0 project; Hugging Face robots.txt permits this public raw results path.',
 verified: 'Marked verified by VANTAGE-Bench.',
 async fetch() {
  const data = await fetchJson<{models: ({name:string;overall:number;date_evaluated:string} & Record<string,unknown>)[]}>(FEED);
  const rows = data.models.filter(r => Number.isFinite(r.overall)).map(r => ({model:r.name, score:r.overall, date:r.date_evaluated,
   params: typeof r.params === 'string' && /^\d+(?:\.\d+)?B$/.test(r.params) ? Number.parseFloat(r.params) : undefined,
   open:r.type === 'open' ? true : r.type === 'closed' ? false : undefined,
   verified:typeof r.verified === 'boolean' ? r.verified : undefined,
   metrics:Object.fromEntries(Object.entries(r).filter(([k,v]) => k !== 'overall' && typeof v === 'number')) as Record<string,number>}));
  if(rows.length < 3 || rows.some(r=>!Number.isFinite(r.score))) throw new Error('Invalid overall results');
  return rows;
 }
};
export default board;

// DISBench reports exact match and F1 for image-search agents.
// Overall EM is the official default ranking. F1 and intra/inter-image scores are metrics.
// Agent and retriever identify the harness; the track is a whole-set configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/RUC-NLPIR/DISBench-Leaderboard/resolve/main/leaderboard_data.json";
const board: Leaderboard = {
 benchmark: "disbench", url: "https://huggingface.co/spaces/RUC-NLPIR/DISBench-Leaderboard", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases:{'Claude-Opus-4-5-20251101':'claude-opus-4-5','Claude-Sonnet-4-5-20250929':'claude-sonnet-4-5'},
 async fetch() {
const d=await fetchJson<any[]>(FEED);return d.flatMap(r=>['em'].map(metric=>({model:/^gpt-4o$/i.test(r.backbone)?r.backbone+' [snapshot unspecified]':r.backbone,harness:[r.agent||r.method,r.retriever].filter(Boolean).join('; retriever '),score:r['overall_'+metric],setting:r.track,date:r.date,metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>typeof v==='number')) as Record<string,number>})));
 },
};
export default board;

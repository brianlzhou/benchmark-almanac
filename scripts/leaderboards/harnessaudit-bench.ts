// HarnessAudit scores the model-harness pair on Overall safety, on the source 0-1 score scale.
// Boundary, execution, stability and perturbation metrics remain on their original scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://harnessaudit.github.io/";
const board: Leaderboard = {
 benchmark: "harnessaudit-bench", url: "https://harnessaudit.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 aliases:{'ChatGPT-5.4':'gpt-5-4'},
 async fetch() {
const html=await fetchText(FEED);const at=html.indexOf('const MODELS =');if(at<0)throw new Error('No model array');const d=jsLiteral<any[]>(html,html.indexOf('[',at));return d.map(r=>({model:r.name.replace(/ \((CC|Codex)\)$/,''),harness:r.group,score:r.Overall,metrics:Object.fromEntries(Object.entries(r).filter(([,v])=>typeof v==='number')) as Record<string,number>}));
 },
};
export default board;

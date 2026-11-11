// BLiMP publishes per-paradigm accuracy for four model families.
// Use the explicit overall score. Exclude 13 aggregate rows from the 67-paradigm category means.
// Linguistic-category means remain metrics; family labels are not guessed checkpoint IDs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/alexwarstadt/blimp/master/raw_results/summary/models_summary.jsonl";
const board: Leaderboard = {
 benchmark: "blimp", url: "https://raw.githubusercontent.com/alexwarstadt/blimp/master/raw_results/summary/models_summary.jsonl", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const all=(await fetchText(FEED)).trim().split(/\r?\n/).map(line=>JSON.parse(line));const data=all.filter(r=>r.UID!=='overall');const overall=all.find(r=>r.UID==='overall'&&r.linguistics_term==='overall');if(!overall||data.length!==67)throw new Error('BLiMP aggregate or 67 paradigms missing');return ['ngram','lstm','txl','gpt2'].map(key=>{const groups=new Map<string,number[]>();for(const r of data){if(typeof r[key]!=='number')throw new Error('Missing model accuracy');const a=groups.get(r.linguistics_term)??[];a.push(r[key]);groups.set(r.linguistics_term,a);}return {model:`BLiMP ${key} family`,score:overall[key]*100,setting:'Equal-weight paradigm mean',metrics:{paradigms:data.length,...Object.fromEntries([...groups].map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length*100]))}};});
 },
};
export default board;

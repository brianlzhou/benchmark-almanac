// ClassEval class-level success percentages for holistic, compositional and incremental generation.
// The headline is class-level pass@1. Sampling and greedy are whole-suite configurations.
// Class-level pass@3 and pass@5 remain metrics alongside method and partial-success scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://fudanselab-classeval.github.io/pass_at_k_result_H.json";
const board: Leaderboard = {
 benchmark: "classeval", url: "https://fudanselab-classeval.github.io/leaderboard.html", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const data=await fetchJson<Record<string,Record<string,Record<string,number>>>>(FEED);const rows:LeaderboardRow[]=[];
for(const [pass,configs]of Object.entries(data))for(const [id,d]of Object.entries(configs)){
 if(pass!=='pass_1'&&pass!=='pass_1_greedy')continue;
 const m=id.match(/^(.*?)_(?:class|method)_([HCI])_(?:t([\d.]+)|greedy)$/);if(!m||!Number.isFinite(d.class_success))continue;
 let model=m[1];if(/^(GPT-3\.5-Turbo|GPT-4(?:-Turbo)?|Gemini-Pro)$/i.test(model))model+=' [snapshot unspecified]';
 const metrics:Record<string,number>={};for(const [k,v]of Object.entries(d))if(Number.isFinite(v)&&k!=='class_success')metrics[k]=v*100;
 for(const k of ['pass_3','pass_5']){const v=data[k]?.[id]?.class_success;if(Number.isFinite(v))metrics[k.replace('_','@')]=v*100;}
 rows.push({model,score:d.class_success*100,harness:({H:'Holistic',C:'Compositional',I:'Incremental'}as Record<string,string>)[m[2]],setting:m[3]?'temperature '+m[3]:'greedy',metrics});}return rows;
 },
};
export default board;

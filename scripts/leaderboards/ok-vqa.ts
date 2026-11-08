// OK-VQA: Overall Accuracy in percent from the official static leaderboard. Preserve specialized
// system names, including the named baselines, without mapping their backbone to a generic model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://okvqa.allenai.org/leaderboard.html";
const board: Leaderboard = {
 benchmark: "ok-vqa", url: "https://okvqa.allenai.org/leaderboard.html", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[2]?.text==='Overall Accuracy');if(!t)throw new Error('OK-VQA table missing');return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);const model=text((r[1]?.html??'').split(/<p\b|<br\s*\/?\s*>/i)[0]);return model&&score!==undefined?[{model,score}]:[];});
 },
};
export default board;

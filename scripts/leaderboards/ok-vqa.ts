// OK-VQA: Overall Accuracy in percent from the official static leaderboard. Preserve specialized
// system names, including the named baselines, without mapping their backbone to a generic model.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://okvqa.allenai.org/leaderboard.html";
const board: Leaderboard = {
 benchmark: "ok-vqa", url: "https://okvqa.allenai.org/leaderboard.html", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[2]?.text==='Overall Accuracy');if(!t)throw new Error('OK-VQA table missing');return t.slice(1).flatMap(r=>{const score=num(r[2]?.text);const html=r[1]?.html??'';const model=text(html.split(/<p\b|<br\s*\/?\s*>/i)[0]);const link=html.match(/href="(https?:\/\/[^"]+)"/i)?.[1];const submitter=text(html.match(/<p\b[^>]*class=["']institution["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]??'')||undefined;return model&&score!==undefined?[{model,score,...(submitter?{submitter}:{}),...(link?{link}:{})}]:[];});
 },
};
export default board;

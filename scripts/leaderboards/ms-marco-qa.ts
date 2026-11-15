// Archived QnA v2.1 board, excluding NLGEN, OpenKP, and human references.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,text} from '../lib/html.ts';
const URL='https://microsoft.github.io/msmarco/';
const board:Leaderboard={benchmark:'ms-marco-qa',url:URL,feed:URL,
 terms:'Public Microsoft leaderboard on GitHub Pages; robots.txt does not restrict this page. Links to X are never followed.',
 async fetch(){const t=tables(await fetchText(URL)).find(t=>t[0]?.some(c=>c.text==='Rouge-L'));if(!t)throw new Error('QA leaderboard missing');
 const out=new Map<string,LeaderboardRow>();for(const c of t.slice(1)){
 if(c.length!==4)continue;const model=text(c[0].html.match(/<strong>([\s\S]*?)<\/strong>/i)?.[1]??c[0].html);if(/Human|Anonymous/i.test(model))continue;
 const score=Number(c[2].text);if(!Number.isFinite(score))throw new Error('Bad ROUGE-L');
 const row={model,score,setting:'QnA v2.1; submitted '+c[1].text,metrics:{bleu1:Number(c[3].text)}};if(!out.has(model)||out.get(model)!.score<score)out.set(model,row);
 }if(out.size<3)throw new Error('Too few QA systems');return [...out.values()];
 }};export default board;

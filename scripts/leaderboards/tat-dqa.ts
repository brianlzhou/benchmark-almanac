// TAT-DQA: published test F1 percentage, with exact match retained separately. These are specialized
// document-QA systems. Each entry identifies the team, date and associated paper.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://nextplusplus.github.io/TAT-DQA/";
const board: Leaderboard = {
 benchmark: "tat-dqa", url: "https://nextplusplus.github.io/TAT-DQA/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
 stats: { exactMatch: { name: 'Exact match', unit: '%', better: 'higher' } },

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Exact Match'));if(!t)throw new Error('TAT-DQA table missing');return t.slice(1).flatMap(r=>{if(/^Human/i.test(r[1]?.text??''))return[];const score=num(r[4]?.text);const stamp=Date.parse(r[5].text+' UTC');return score===undefined?[]:[{model:r[1].text,score,submitter:r[2].text==='-'?undefined:r[2].text,params:num(r[1].text.match(/\(([\d.]+)B\)/)?.[1]),date:Number.isFinite(stamp)?new Date(stamp).toISOString().slice(0,10):undefined,link:r[6].html.match(/href="(https?:\/\/[^" ]+)"/)?.[1],metrics:{exactMatch:num(r[3].text)!}}];});
 },
};
export default board;

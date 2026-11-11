// TAT-DQA: published test F1 percentage, with exact match retained separately. These are specialized
// document-QA systems; preserve their names and sizes rather than crediting generic backbones.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://nextplusplus.github.io/TAT-DQA/";
const board: Leaderboard = {
 benchmark: "tat-dqa", url: "https://nextplusplus.github.io/TAT-DQA/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Exact Match'));if(!t)throw new Error('TAT-DQA table missing');return t.slice(1).flatMap(r=>{if(/^Human/i.test(r[1]?.text??''))return[];const score=num(r[4]?.text);return score===undefined?[]:[{model:r[1].text,score,metrics:{exactMatch:num(r[3].text)!}}];});
 },
};
export default board;

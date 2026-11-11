// SQuAD 2.0: the first official leaderboard table, ranked by test F1 percentage. Keep EM as a metric.
// The second table is SQuAD 1.1 and is excluded. Remove team affiliations, preserving submission names
// and the single-model/ensemble setting; human reference performance is not a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://rajpurkar.github.io/SQuAD-explorer/";
const board: Leaderboard = {
 benchmark: "squad-v2", url: "https://rajpurkar.github.io/SQuAD-explorer/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED))[0];if(t?.[0]?.map(c=>c.text).join('|')!=='Rank|Model|EM|F1')throw new Error('SQuAD table changed');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){if(!/^\d/.test(r[0]?.text??''))continue;const score=num(r[3]?.text);if(score===undefined)continue;let model=text(r[1].html.split(/<p\b/i)[0]);const mode=model.match(/\s*\((ensemble|single model)\)$/i);if(mode)model=model.slice(0,mode.index);rows.push({model,score,setting:mode?.[1],metrics:{exactMatch:num(r[2].text)!}});}
if(!rows.length)throw new Error('No SQuAD 2.0 submissions');return rows;
 },
};
export default board;

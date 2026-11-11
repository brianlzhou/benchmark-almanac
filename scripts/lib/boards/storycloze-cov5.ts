// CodaLab publishes anonymous submission identities, not underlying language models.
import {fetchText} from '../util.ts';
import {tables} from '../html.ts';
import type {Leaderboard} from '../../leaderboards/types.ts';
export function storyBoard(benchmark:string,phase:number): Leaderboard {
 const url='https://competitions.codalab.org/competitions/15333';const feed=`${url}/results/${phase}`;
 return {benchmark,url,feed,terms:'Public CodaLab competition results. The Almanac credits the Story Cloze authors and CodaLab and links the source.',
 async fetch(){const t=tables(await fetchText(feed)).find(t=>t.some(r=>r.some(c=>c.text==='PercentageScore')));if(!t)throw new Error('Story Cloze table missing');
 const rows=t.flatMap(r=>{const n=r[4]?.text.match(/^(0?\.\d+|1(?:\.0+)?)\s*\(/);return n&&r[1]?.text?[{model:`CodaLab submission ${r[1].text}`,score:Number(n[1])*100}]:[];});
 if(!rows.length)throw new Error('Story Cloze scores missing');return rows;}};
}

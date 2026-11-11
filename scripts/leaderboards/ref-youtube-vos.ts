// Official Refer-YouTube-VOS CodaLab Testing phase. Overall is mean J and F, supplied as a fraction.
// The board identifies submissions by public entrant handles, not underlying models. Preserve those identities as unlisted systems.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables,num} from '../lib/html.ts';
const PAGE='https://competitions.codalab.org/competitions/29139';
const FEED=PAGE+'/results/47908';
export default {benchmark:'ref-youtube-vos',url:PAGE,feed:FEED,
 terms:'Public official competition results hosted by CodaLab; the almanac credits the Refer-YouTube-VOS organizers and links the source.',
 async fetch():Promise<LeaderboardRow[]> {
  const t=tables(await fetchText(FEED)).find(t=>t.some(r=>r.some(c=>c.text==='Overall')));
  if(!t)throw new Error('Refer-YouTube-VOS Testing results missing');
  const rows:LeaderboardRow[]=[];
  for(const r of t){
   if(r.length!==7)continue;const score=num(r[4].text);if(score===undefined||num(r[0].text)===undefined)continue;
   const date=r[3].text.match(/^(\d\d)\/(\d\d)\/(\d\d)$/);
   rows.push({model:`CodaLab submission: ${r[1].text}`,score:score*100,setting:'Testing',date:date?`20${date[3]}-${date[1]}-${date[2]}`:undefined,metrics:{J:num(r[5].text)!*100,F:num(r[6].text)!*100,entries:num(r[2].text)!}});
  }
  if(!rows.length)throw new Error('Refer-YouTube-VOS has no scored submissions');return rows;
 }
} satisfies Leaderboard;

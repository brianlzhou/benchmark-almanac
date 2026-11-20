// Provisional 60-question test scores. The README describes three attempts and bootstrap intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
const url='https://github.com/halachabench/halacha-bench-results';
const feed='https://raw.githubusercontent.com/halachabench/halacha-bench-results/HEAD/README.md';
export default {
  benchmark:'halachabench',url,feed,
  terms:'The authors publish these provisional scores in their public results repository; the raw README path is allowed by robots.txt. No separate results-use restriction is stated.',
  async fetch():Promise<LeaderboardRow[]> {
    const t=markdownTables(await fetchText(feed)).find(t=>t[0].join('|')==='#|Model|Score|95% interval|Worst of 3|How it ran');
    if(!t)throw new Error('HalachaBench results columns changed');
    const rows=t.slice(1).map(r=>{
      const interval=r[3].match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
      if(!interval || !/^\d+(?:\.\d+)?$/.test(r[2]))throw new Error('HalachaBench invalid score or interval');
      const how=r[5].replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g,'').trim();
      const [harness,...settings]=how.split(', ');
      return {model:r[1].replace(/\s*†/g,'').trim(),score:Number(r[2]),low:Number(interval[1]),high:Number(interval[2]),trials:3,harness,setting:['provisional; 60 test questions',...settings].join('; '),metrics:{worstOf3:Number(r[4])}};
    });
    if(rows.length<3)throw new Error('HalachaBench model rows missing');
    return rows;
  },
} satisfies Leaderboard;

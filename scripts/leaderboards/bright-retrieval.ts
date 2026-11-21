// BRIGHT: the leaderboard Score, mean nDCG@10 across all 12 datasets.
// Read the credited team, submission date, and retriever link. Long-document recall is a separate metric.
// Research retrievers remain unlisted when absent from the model registry. The score already uses the published 0-to-100 scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://brightbenchmark.github.io/";
const board: Leaderboard = {
  benchmark: "bright-retrieval",
  url: "https://brightbenchmark.github.io/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const boards=tables((await fetchText(FEED)).replace(/<!--[\s\S]*?-->/g,'')).filter(t=>t[0]?.some(c=>c.text==='Retriever'));
      const t=boards[0];
      if(!t)throw new Error('BRIGHT table missing');
      const label=(html:string)=>text(html.split(/<br\b/i)[0]);
      const longScores=new Map(boards[1]?.slice(1).map(r=>[label(r[1].html),num(r[2]?.text)]));
      return t.slice(1).filter(r=>r.length===3&&num(r[2].text)!==undefined).map(r=>{
        const model=label(r[1].html);
        const submitter=text(r[1].html.match(/<i>([\s\S]*?)<\/i>/i)?.[1] ?? '');
        const link=r[1].html.match(/href="(https?:\/\/[^"]+)"/i)?.[1];
        const stamp=Date.parse(text(r[0].html.match(/<span[^>]*class="date[^"]*"[^>]*>([^<]+)</)?.[1] ?? '')+' UTC');
        const metrics:Record<string,number>={};
        const long=longScores.get(model);
        if(long!==undefined) metrics.longRecall1=long;
        return {model, score:num(r[2].text)!, submitter:submitter || undefined, link, metrics,
          date:Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0,10) : undefined};
      });
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;

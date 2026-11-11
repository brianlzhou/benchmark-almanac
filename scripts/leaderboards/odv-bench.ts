// Official ODV-Bench website table. Overall accuracy covers all three task groups.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = 'https://happyzqy.github.io/StreamForest/';
const board: Leaderboard = {
  benchmark: 'odv-bench', url: URL, feed: URL,
  terms: 'The official project website uses CC BY-SA 4.0. Benchmark Almanac credits and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(URL)).find(t => t[0]?.some(c=>c.text==='Overall') && t[1]?.some(c=>c.text==='RTP'));
    if (!t) throw new Error('ODV-Bench table missing');
    const keys=['RTP','HD','KIE','TCD','DDM','PTM','staticAverage','AP','LP','DP','dynamicAverage','RP','RA','ARA','eventAverage'];
    return t.slice(2).filter(r=>r.length===20 && num(r[19].text)!==undefined).map(r=>{
      const name = r[1].text.replace(/⭐/g,'').replace(/\s+(?:Ours|Alibaba|NJU|Shanghai AI Lab|Bytedance|OpenBMB|LMMs-Lab|CUHK|THU)$/,'').trim();
      const model = /MiniCPM-V 2.6/.test(name) ? name : `${name} ${r[2].text}`;
      const metrics: Record<string,number> = {};
      keys.forEach((k,i)=>{const n=num(r[4+i].text);if(n!==undefined)metrics[k]=n;});
      return {model,score:num(r[19].text)!,setting:`frames=${r[3].text}`,metrics};
    });
  },
};
export default board;

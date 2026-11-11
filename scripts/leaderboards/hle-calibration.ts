// Scale's HLE calibration table. GSM8k tables later in the article are separate evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL='https://scale.com/blog/o3-o4-mini-calibration';
const board: Leaderboard={
  benchmark:'hle-calibration',url:URL,feed:URL,
  terms:'Scale terms restrict automated extraction. Benchmark Almanac credits Scale AI and links the official source.',
  async fetch():Promise<LeaderboardRow[]> {
    const t=tables(await fetchText(URL)).find(t=>t[0]?.[1]?.text==='Accuracy (%) — Higher is better');
    if(!t)throw new Error('HLE calibration table missing');
    return t.slice(1).filter(r=>num(r[3]?.text)!==undefined).map(r=>({
      model:r[0].text.replace(/ \(.+\)$/,''),score:num(r[3].text)!,
      setting:r[0].text.includes('text only')?'text only; high':r[0].text.includes('high')?'high':undefined,
      date:r[0].text.includes('December 2024')?'2024-12-17':undefined,
      metrics:{accuracy:num(r[1].text)!,confidence:num(r[2].text)!},
    }));
  },
};
export default board;

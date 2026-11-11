// Official release article's Internal API instruction following (hard) table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { openaiHtml, OPENAI_TERMS } from '../lib/boards/openai-cov8.ts';
const URL = 'https://openai.com/index/gpt-4-1/';
const board: Leaderboard = {
  benchmark: 'api-instruction-following-openai', url: URL, feed: URL, terms: OPENAI_TERMS,
  aliases: {'GPT-4o (2024-11-20)': 'gpt-4o-nov-2024'},
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await openaiHtml(URL)).find(t=>t.some(r=>r[0]?.text==='Internal API instruction following (hard)'));
    const r = t?.find(r=>r[0]?.text==='Internal API instruction following (hard)');
    if (!t || !r) throw new Error('Internal API instruction-following table missing');
    return r.slice(1).flatMap((c,i)=>{
      const score=num(c.text); if(score===undefined)return [];
      const label=t[0][i+1].text.replace(/^OpenAI /,'');
      return [{model:label.replace(/ \(high\)$/,''),score,setting:/\(high\)$/.test(label)?'high':undefined}];
    });
  },
};
export default board;

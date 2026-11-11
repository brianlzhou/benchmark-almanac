// Stick To Your Role: published headline Ordinal (Win rate), on its 0-to-1 scale.
// Cardinal score and the five stability statistics remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/flowers-team/StickToYourRoleLeaderboard/raw/main/static/leaderboard.csv";
const board: Leaderboard = {
  benchmark: "stick-to-your-role",
  url: "https://huggingface.co/spaces/flowers-team/StickToYourRoleLeaderboard/raw/main/static/leaderboard.csv",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      return parseCsv(await fetchText(FEED)).map(r=>({model:r.Model,score:Number(r['Ordinal (Win rate)']),metrics:{cardinal:Number(r['Cardinal (Score)']),roStability:Number(r['RO Stability']),stress:Number(r.Stress),cfi:Number(r.CFI),srmr:Number(r.SRMR),rmsea:Number(r.RMSEA)}}));
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

// Social IQa paper: development accuracy, matching the catalog note.
// These static paper rows will not refresh. Test accuracy is a secondary metric. Context ablations are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/1904.09728";
const board: Leaderboard = {
  benchmark: "siqa",
  url: "https://arxiv.org/html/1904.09728",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t = tables(await fetchText(FEED)).find(t => t.some(r => r[0]?.text === 'BERT-base'));
      if (!t) throw new Error('Social IQa results missing');
      return t.filter(r => /^(GPT|BERT-base|BERT-large)$/.test(r[0]?.text)).map(r=>({model:r[0].text,score:num(r[1].text)!,metrics:{test:num(r[2].text)!}}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;

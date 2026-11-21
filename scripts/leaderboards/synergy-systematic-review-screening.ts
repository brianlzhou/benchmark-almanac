// 67AI Lab ranks systematic review screeners by recall in the top half of the ranked records. Its four-review comparison includes average precision and work saved.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://67ailab.com/posts/spark-eval-04-l1-literature-screening/";
const board: Leaderboard = {
  benchmark: 'synergy-systematic-review-screening',
  stats: { precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Stored as a fraction from 0 to 1.' }, sampleAgreement: { name: 'Sample agreement', unit: 'score', better: 'higher' }, workSaved: { name: 'Work saved', unit: 'score', better: 'higher', note: 'Stored as a fraction from 0 to 1.' } },
  url: "https://67ailab.com/posts/spark-eval-04-l1-literature-screening/",
  feed,
  terms: "The host allows crawling. The publisher gives no separate reuse terms for the score table. https://67ailab.com/posts/spark-eval-04-l1-literature-screening/",
  host: '67AI Lab',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'Nemotron 3.5 30B-A3B': 'nemotron-3-5-lightning-30b-a3b' },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Model|Recall @50%|Avg. precision|Work saved @95%|Sample agreement (ρ)|Verdict');
    if (!t || t.length < 8) throw new Error('Missing SYNERGY screening results');
    return t.slice(1).map(c => {
      const model = c[0].text, score = num(c[1].text), precision = num(c[2].text), workSaved = num(c[3].text), rho = num(c[4].text);
      if (!model || score == null || precision == null || workSaved == null) throw new Error('Invalid screening result');
      const metrics: Record<string, number> = { precision, workSaved };
      if (rho != null) metrics.sampleAgreement = rho;
      return { model, score, metrics, trials: rho == null ? undefined : 3 };
    });
  },
};
export default board;

// RSI Arena paper: Stage 1 human-arena Rating of each agent-trained model.
// These static paper rows will not refresh. The agent identity names the training system. GPU hours and API spending cover training.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2610.33624";
const board: Leaderboard = {
  benchmark: "rsi-arena", static: 'paper',
  url: "https://arxiv.org/html/2610.33624",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const published = tables(await fetchText(FEED));
      const t=published.find(t=>t[0]?.[0]?.text==='Agent'&&t[0]?.at(-1)?.text==='Rating');
      if(!t)throw new Error('RSI ratings missing');
      const ratings = published.find(table => table[1]?.[2]?.text === '95% interval');
      const stage2 = published.find(table => table[0]?.[7]?.text === 'Tokens');
      return t.slice(1).filter(r => r.length === 10 && num(r[9].text) !== undefined).map(r => {
        const model = r[0].text;
        const rating = ratings?.find(row => row[0]?.text === model);
        const training = stage2?.find(row => row[0]?.text === model);
        const interval = rating?.[2]?.text.split('–');
        const lengths = training?.[7]?.text.match(/[\d,]+/g);
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries({
          gpuHours: r[3].text, trainingCost: r[4].text, jobs: r[5].text, nominations: r[6].text,
          benchmarkProgress: r[8].text, medianAnswerTokens: lengths?.[0], stage2MedianAnswerTokens: lengths?.[1],
          unadjustedRating: rating?.[3]?.text, stage2Rating: rating?.[4]?.text, stage2UnadjustedRating: rating?.[6]?.text,
          stage2GpuHours: training?.[2]?.text, stage2TrainingCost: training?.[3]?.text,
          stage2Jobs: training?.[4]?.text, stage2Nominations: training?.[5]?.text,
        })) {
          const parsed = num(value);
          if (parsed !== undefined) metrics[key] = parsed;
        }
        return { model, score: num(r[9].text)!, low: num(interval?.[0]), high: num(interval?.[1]), metrics };
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

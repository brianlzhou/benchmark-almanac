// Act2Answer: use the project page's VLA radar mean across all twelve categories.
// The page defines its displayed "mean" as "Math.round(m.vals.reduce(function (s, v) { return s + v; }, 0) / N)".
// Keep only the models in that published overview. Category scores remain metrics, and linear probes are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://tttonyalpha.github.io/act2answer/";
const board: Leaderboard = {
  benchmark: "act2answer", url: "https://tttonyalpha.github.io/act2answer/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const marker = 'var models = ';
    const at = source.indexOf(marker);
    if (at < 0) throw new Error('Act2Answer overview missing');
    const block = source.slice(at + marker.length, source.indexOf('];', at) + 1);
    const models = [...block.matchAll(/name: '([^']+)', color: '[^']+', vals: (\[[^\]]+\])/g)]
      .map(m => ({name: m[1], vals: JSON.parse(m[2]) as number[]}));
    const header = tables(source).find(t => t[1]?.some(c => c.text === 'Emotion'))?.[1];
    if (!header || header.length !== 12) throw new Error('Act2Answer categories missing');
    const rows: LeaderboardRow[] = models.map(m => {
      if (m.vals.length !== 12 || !m.vals.every(Number.isFinite)) throw new Error('Incomplete Act2Answer overview');
      return {model: m.name.replace('π₀', 'pi0'), score: Math.round(m.vals.reduce((a,b) => a+b, 0) / m.vals.length),
        metrics: Object.fromEntries(m.vals.map((v,i) => [header[i].text.toLowerCase().replace(/\W+/g,'_'), v]))};
    });
    if (!rows.length) throw new Error("No act2answer score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;


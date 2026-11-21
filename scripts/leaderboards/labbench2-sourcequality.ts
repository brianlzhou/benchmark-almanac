// Edison measures a model’s ability to evaluate scientific sources. The SourceQuality results table gives average score, output tokens and duration for each variant.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://advances.edisonscientific.com/benchmarks/labbench2/sourcequality/";

const board: Leaderboard = {
  benchmark: "labbench2-sourcequality",
  url: "https://advances.edisonscientific.com/benchmarks/labbench2/sourcequality/",
  feed: FEED,
  terms: "The page provides a public score table. Check its source for license details. https://advances.edisonscientific.com/benchmarks/labbench2/sourcequality/ The robots URL returns HTML.",
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[4]?.text.startsWith('Average score'));
    const columns = ['#', 'Model', 'Variant', 'Mode', 'Average score', 'Average output tokens', 'Avg. dur', 'Date'];
    if (!table || table.length < 11 || !columns.every((name, i) => table[0][i]?.text.startsWith(name))) throw new Error('Missing SourceQuality results');
    return table.slice(1).map(cells => {
      const [,model,variant,mode,value,output,time,date] = cells.map(c => c.text);
      const score = num(value), tokens = num(output), duration = num(time);
      if (!model || score == null || tokens == null || duration == null) throw new Error('Incomplete SourceQuality result');
      return { model, score: score * 100, setting: [variant === '—' ? '' : variant, mode].filter(Boolean).join(' / '),
        tokens: tokens * (output.endsWith('k') ? 1000 : 1), date, metrics: { latency: duration * (time.endsWith('m') ? 60 : 1) } };
    });
  },
};
export default board;

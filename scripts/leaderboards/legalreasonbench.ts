// LegalReasonBench (micro1). A static micro1 report page (see realmpathology.ts for the reader): the main
// results table gives per model the mean rubric score (0 to 1) over 150 runs on 50 matters, the median,
// a 95% interval, best@3, all-pass runs and wins. Mean is the headline (Gemini 4 Argon led at 0.508) and
// the score, as a percent. Median (`median`) and best@3 (`bestOf3`) are kept as percents through micro1Rows'
// Solver costs and output tokens are per matter, the benchmark task.
// metric columns, and the 95% CI cell ("[0.469, 0.548]") as ciLow and ciHigh.
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
import type { Leaderboard } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Rows } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/legal-reason-bench';

const board: Leaderboard = {
  benchmark: 'legalreasonbench',
  url: PAGE,
  feed: `${PAGE} (static HTML results table, Mean)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const rows = await micro1Rows(PAGE, 'Mean', { Median: 'median', 'best@3': 'bestOf3', '95% CI': 'ci' });
    const html = await fetchText(PAGE);
    const all = tables(html).map(t=>t.map(r=>r.map(c=>c.text)));
    const costs=all.find(t=>t[0]?.includes('Solver cost per matter'));
    const usage=all.find(t=>t[0]?.includes('Output tokens'));
    const clean=(s:string)=>s.replace(/\*$/,'').trim();
    for (const row of rows) {
      const cost=costs?.find(r=>clean(r[0])===row.model), use=usage?.find(r=>clean(r[0])===row.model);
      if(cost)row.cost=num(cost[1]);
      if(use){const cell=use[7], n=num(cell);if(n!==undefined)row.tokens=n*(/k/i.test(cell)?1000:1);row.metrics={...row.metrics,turns:num(use[2])!,toolCalls:num(use[1])!};}
    }
    // The live leaderboard adds models before the static report tables are revised.
    // Read literal values only, never execute the site's JavaScript.
    const source = html.split('window.benchmarks_data["legal-reason-bench"] =')[1]?.split('</script>')[0];
    if (!source) throw new Error('LegalReasonBench live data missing');
    const read = (id: string) => {
      const part = source.split(`id: "${id}"`)[1]?.match(/rows:\s*\[([\s\S]*?)\]/)?.[1];
      if (!part) throw new Error(`LegalReasonBench ${id} rows missing`);
      return [...part.matchAll(/name:\s*"([^"]+)"\s*,\s*score:\s*([\d.]+)/g)]
        .map(m=>({model:clean(m[1]),score:Number(m[2])}));
    };
    const best = new Map(read('best-at-3').map(r=>[r.model,r.score]));
    for (const current of read('mean')) {
      const old = rows.find(r=>r.model===current.model);
      if (old && Math.abs(old.score-current.score)>0.011) throw new Error(`Report score changed for ${current.model}`);
      if (!old) rows.push({...current, metrics:{...(best.has(current.model)?{bestOf3:best.get(current.model)!}:{})}});
    }
    return rows;
  },
};
export default board;

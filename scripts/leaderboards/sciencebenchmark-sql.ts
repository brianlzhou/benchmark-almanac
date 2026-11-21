// ScienceBenchmark ranks text-to-SQL systems by execution accuracy on the hidden test set.
// Read the overall HTML table and join its three database tables by model name.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://sciencebenchmark.cloudlab.zhaw.ch/";
const feed = url;
type Result = { model: string, score: number, dev: number, date?: string, link?: string };
const board: Leaderboard = {
  benchmark: 'sciencebenchmark-sql', url, feed,
  terms: "The organizers state no score reuse license. The robots.txt URL returns HTML.",
  parts: { CORDIS: 'CORDIS', SDSS: 'SDSS', OncoMx: 'OncoMX' },
  async fetch() {
    const page = await fetchText(feed);
    const results = new Map<string, Map<string, Result>>();
    for (const m of page.matchAll(/<h4 class="card-header">(\w+) Leaderboard - Execution Accuracy<\/h4>([\s\S]*?<\/table>)/g)) {
      const [header, ...rows] = tables(m[2])[0];
      if (header.map(c => c.text).join('|') !== 'Rank|Model|Code|Dev (%)|Test (%)' || rows.length < 3) throw new Error('Incomplete ' + m[1]);
      results.set(m[1], new Map(rows.map(c => {
        const [rank, model, code, dev, test] = c;
        if (!model.text || ![dev,test].every(x => /^\d+(\.\d+)?%$/.test(x.text))) throw new Error('Invalid execution accuracy');
        const date = rank.html.match(/class="date">([^<]+)</)?.[1];
        return [model.text, { model: model.text, score: parseFloat(test.text), dev: parseFloat(dev.text),
          date: date ? new Date(date + ' UTC').toISOString().slice(0,10) : undefined, link: code.html.match(/href="([^"]+)"/)?.[1] }];
      })));
    }
    const overall = results.get('Overall');
    if (!overall) throw new Error('No overall leaderboard');
    return [...overall.values()].map(({dev, ...row}) => {
      const metrics: Record<string, number> = { dev };
      for (const db of Object.keys(board.parts!)) {
        const r = results.get(db)?.get(row.model);
        if (!r) throw new Error('Missing ' + db + ' result for ' + row.model);
        metrics[db] = r.score;
        metrics[db + 'Dev'] = r.dev;
      }
      return { ...row, metrics };
    });
  },
};
export default board;

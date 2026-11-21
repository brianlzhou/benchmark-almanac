// KuralHub compares speech emotion classifiers by mean test accuracy across 33 datasets.
// Table B gives the published overall means. The public runs CSV gives accuracy on each dataset.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://aaivu.github.io/KuralHub/index.html";


const board: Leaderboard = {
  benchmark: "kuralhub",
  url: "https://aaivu.github.io/KuralHub/benchmark.html",
  feed,
  terms: "The repository licenses code and documentation under MIT. The source datasets retain their own licenses. https://github.com/aaivu/KuralHub#license The host serves no robots.txt rules.",
  stats: {
    macroF1: { name: 'Macro F1', unit: '%', better: 'higher' },
    weightedF1: { name: 'Weighted F1', unit: '%', better: 'higher' },
  },
  async fetch() {
    const ts = tables(await fetchText(feed));
    const table = ts.find(t=>t[0].map(c=>c.text).join('|') === 'Family|Checkpoint|Params|Accuracy|Macro-F1|Weighted-F1');
    if (!table || table.length < 12) throw new Error('Missing KuralHub mean scores');
    await new Promise(resolve=>setTimeout(resolve,1000));
    const runs = parseCsv(await fetchText('https://aaivu.github.io/KuralHub/data/runs.csv'));
    board.parts = {};
    return table.slice(1).map(cells=>{
      const [, model, size, avg, macro, weighted] = cells.map(c=>c.text);
      const metrics: Record<string,number> = { macroF1:100*Number(macro), weightedF1:100*Number(weighted) };
      const subset = runs.filter(r=>r.model === model);
      if (subset.length < 33 || !avg || !Number.isFinite(Number(avg))) throw new Error('Incomplete dataset coverage for '+model);
      for (const r of subset) {
        if (!r.dataset || !r.test_accuracy || !Number.isFinite(Number(r.test_accuracy))) throw new Error('Missing dataset accuracy');
        const key = 'dataset_' + r.dataset;
        board.parts![key] = { name: r.catalog_dataset || r.dataset, group: r.language };
        metrics[key] = 100*Number(r.test_accuracy);
      }
      const sizeMatch = /([\d,.]+)([BM])/.exec(size);
      return { model, score:100*Number(avg), params:sizeMatch ? Number(sizeMatch[1].replaceAll(',',''))/(sizeMatch[2]==='M'?1000:1) : undefined, metrics };
    });
  },
};
export default board;

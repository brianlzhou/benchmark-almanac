// Real-SWE measures resolution of private enterprise coding tasks. The makers replaced the live page
// with version 1.1. This September archive preserves the original table, its confidence whiskers,
// per-task pass counts and estimated rollout costs. The headline is the exact resolution percentage.
import { gunzipSync } from 'node:zlib';
import type { Leaderboard, BoardPart } from './types.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://web.archive.org/web/20260923112431id_/https://withspecific.com/benchmarks/real-swe';
const taskNames = ['API keys & environments', 'Multi-region sweep', 'Entitlement overage lines', 'Customer identity migration', 'Billing schedule migration', 'API token metering', 'S3 datastore measurement', 'Linearizable scan', 'Tax jurisdiction', 'Analytics stream reducer'];
const parts: Record<string,BoardPart> = Object.fromEntries(taskNames.map(name => [name.replace(/[^A-Za-z0-9]/g, ''), {name, unit: '%'}]));
const board: Leaderboard = {
  benchmark: 'real-swe', harnesses: 'system', url: feed.replace('id_/', '/'), feed, parts,
  terms: 'Specific Labs published these results. The Internet Archive provides the September snapshot (https://archive.org/about/terms.php).',
  async fetch() {
    const response = await fetch(feed);
    if (!response.ok) throw new Error('Archive HTTP ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    const html = (bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes).toString();
    const all = tables(html);
    const ranks = all.find(t => t[0].map(c => c.text).join('|') === '#|Model|Harness|Resolution rate');
    const tasks = all.find(t => t[0][0]?.text === 'Task');
    const costs = all.find(t => t[0].map(c => c.text).join('|') === 'Rank|Model|Estimated cost (USD)');
    if (!ranks || !tasks || tasks.length !== 11 || !costs) throw new Error('Missing original September results');
    const rows = ranks.slice(1).map(([,name,harness,rate]) => {
      const model = name.text;
      const col = tasks[0].findIndex(c => c.text === model);
      const costCell = costs.slice(1).find(r => r[1].text === model)?.[2].text;
      const bar = rate.html.match(/style="width:([\d.]+)%;background-color/);
      const whisker = rate.html.match(/data-confidence-whisker="true"[^>]*style="left:([\d.]+)%;width:([\d.]+)%/);
      if (!bar || !whisker || col < 1 || !costCell?.match(/^\$[\d.]+$/)) throw new Error('Missing values for ' + model);
      const score = Number(bar[1]);
      const low = Number(whisker[1]);
      const metrics: Record<string,number> = {};
      let passed = 0;
      let trials = 0;
      for (const r of tasks.slice(1)) {
        const name = r[0].text;
        const key = name.replace(/[^A-Za-z0-9]/g,'');
        const count = r[col].text.match(/^(\d+) \/ (\d+)$/);
        if (!count || !Number(count[2])) throw new Error('Missing task counts: ' + name);
        passed += Number(count[1]);
        trials += Number(count[2]);
        metrics[key] = 100 * Number(count[1]) / Number(count[2]);
      }
      if (Math.abs(score - 100 * passed / trials) > 0.00001) throw new Error('Task total disagrees with headline');
      return { model, harness: harness.text, score, low, high: low + Number(whisker[2]), cost: Number(costCell.slice(1)), trials, metrics };
    });
    return checked(rows,8);
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Cozzo calls nine dental receptionist systems. The first table gives six success counts, median latency and talk-overs.
// Cozzo qualifies Bland's interruption score as an upper bound and Millis's booking count as clear passes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://cozzo.io/benchmarks/round-6';
const parts = { quote: 'Quote $189', quoteReadback: 'Quote read-back', booking: 'Booking + read-back',
  triage: 'Triage', afterHours: 'After-hours', interrupt: 'Interrupt (≤ 2.44 s)' };
const board: Leaderboard = {
  benchmark: 'cozzo-ai-receptionist-round-6', url: feed, feed, parts,
  terms: 'Cozzo publishes its results under its site terms. https://cozzo.io/terms',
  async fetch() {
    const header = ['Vendor', ...Object.values(parts), 'Median ms (turns)', 'Talk-overs'];
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === header.join('|'));
    if (!table) throw new Error('Missing dental-office leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [vendor, ...values] = cells.map(c => c.text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ''));
      if (values.length !== 8) throw new Error('Invalid dental results for ' + vendor);
      if (vendor === 'Ultravox' && values[2] === 'Partial ×3') continue;
      const metrics: Record<string, number> = {};
      let sum = 0;
      Object.keys(parts).forEach((key, i) => {
        const m = values[i].match(/^(\d+)\/(\d+)(?: clear)?$/);
        if (!m || Number(m[2]) < 1 || Number(m[1]) > Number(m[2])) throw new Error('Invalid pass count for ' + vendor);
        const rate = 100 * Number(m[1]) / Number(m[2]);
        metrics[key] = rate;
        metrics[key + 'Trials'] = Number(m[2]);
        sum += rate;
      });
      const latency = values[6].match(/^(\d+) \((\d+)\)$/);
      if (!latency || !/^\d+$/.test(values[7])) throw new Error('Missing timing or talk-overs');
      metrics.medianReplyMs = Number(latency[1]);
      metrics.turns = Number(latency[2]);
      metrics.talkOvers = Number(values[7]);
      const name = vendor.match(/^([^()]+?)(?: \(([^)]+)\))?$/);
      if (!name) throw new Error('Unknown vendor label ' + vendor);
      rows.push({ model: name[1], harness: name[1], setting: name[2], metrics, score: sum / Object.keys(parts).length });
    }
    return checked(rows, 8);
  },
  harnesses: 'system',
};
export default board;

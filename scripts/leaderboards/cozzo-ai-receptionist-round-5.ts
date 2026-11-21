// Cozzo tested receptionist platforms on calls to three businesses. The first table starts with the roofing quote pass rate.
// Outcomes are percentages and interruption times are seconds. The separate OpenAI partial run used a different prompt.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://cozzo.io/benchmarks/round-5';
const industries = ['Roofing', 'Gym', 'Coaching'];
const parts: Record<string, BoardPart> = {};
const board: Leaderboard = {
  benchmark: 'cozzo-ai-receptionist-round-5', url: feed, feed, parts, harnesses: 'system',
  terms: 'Cozzo publishes the results under its site terms. https://cozzo.io/terms',
  async fetch() {
    const all = tables(await fetchText(feed));
    if (all.length !== 4 || !all[3][0][1].text.includes('Roofing (ms)')) throw new Error('Missing Cozzo comparison tables');
    const rows = [];
    for (const [name, ...latencies] of all[3].slice(1).map(r => r.map(c => c.text))) {
      const metrics: Record<string, number> = {};
      for (const [i, industry] of industries.entries()) {
        const table = all[i];
        if (table[0][1]?.text !== 'Quote' || !table[0].at(-1)?.text.startsWith('Interrupt')) throw new Error('Changed call metrics');
        const cells = table.find(r => r[0].text === name);
        if (!cells) throw new Error('Missing vendor ' + name);
        const latency = latencies[i].match(/^(\d+)\s*\((\d+)\)/);
        if (!latency) throw new Error('Missing reply time');
        metrics[industry + 'MedianReplyMs'] = Number(latency[1]);
        metrics[industry + 'Replies'] = Number(latency[2]);
        for (let j = 1; j < cells.length; j++) {
          const label = table[0][j].text;
          const value = cells[j].text;
          if (value === 'Unresolved' || value === 'no overlap') continue;
          if (label.startsWith('Interrupt')) {
            if (!/^[\d.]+ s/.test(value)) throw new Error('Invalid interruption time');
            metrics[industry + 'InterruptionSeconds'] = parseFloat(value);
          } else {
            const ratio = value.match(/^(\d+)\/(\d+)/);
            if (!ratio || !Number(ratio[2])) throw new Error('Invalid call outcome');
            const key = industry + label.replaceAll('-', '');
            metrics[key] = 100 * Number(ratio[1]) / Number(ratio[2]);
            metrics[key + 'Calls'] = Number(ratio[2]);
            parts[key] = { name: label, group: industry, unit: '%' };
          }
        }
      }
      if (metrics.RoofingQuote !== undefined) rows.push({ model: name, harness: name, score: metrics.RoofingQuote, metrics, date: '2026-10-23' });
    }
    return checked(rows, 6);
  },
};
export default board;

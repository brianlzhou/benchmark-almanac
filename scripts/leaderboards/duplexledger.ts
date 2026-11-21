// DuplexLedger tests full-duplex interaction and memory in spoken conversations.
// Table 3 presents both dimensions. Its first performance metric is conditional full-duplex success.
// The preceding challenge realization rate measures exposure, and the paper excludes it from performance rankings.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.27581';
const interaction = ['RCR', 'cFD', 'Early', 'Pre-end', 'Win-Intr.', 'Stop@0.8', 'Stop (s)'];
const memory = ['Resp.', 'Latest', 'Stale', 'D-Adopt', 'D-Rej.', 'Final'];
const parts: Record<string,BoardPart> = {};
for (const name of [...interaction.slice(1, 6), ...memory]) parts[name] = { name, group: name === 'Resp.' || name === 'Latest' || name === 'Stale' || name === 'D-Adopt' || name === 'D-Rej.' || name === 'Final' ? 'Memory fidelity' : 'Full-duplex interaction' };
const board: Leaderboard = {
  benchmark: 'duplexledger', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/', parts,
  headline: 'The paper reports no overall score, so the headline is conditional full-duplex success on realized challenges.',
  aliases: { 'MiniCPM -o 4.5': 'minicpm-o-4-5' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = new Map<string, Record<string,number>>();
    for (const [section, labels] of [['(a) Full-duplex interaction', interaction], ['(b) Memory fidelity', memory]] as const) {
      const table = tables.find(t => t[0][0] === section);
      const headers = table?.[1].slice(1);
      if (!table || !headers || headers.length !== labels.length || labels.some((l,i) => !headers[i].startsWith(l))) throw Error('Missing ' + section);
      for (const [model, ...cells] of table.slice(2)) {
        const metrics = results.get(model) ?? {};
        if (cells.length !== labels.length || cells.some(c => !c || !Number.isFinite(Number(c)))) throw Error('Invalid metrics for ' + model);
        labels.forEach((label,i) => {
          metrics[label] = Number(cells[i]);
          if (label !== 'RCR' && label !== 'Stop (s)') parts[label] = { name: label, group: section.slice(4),
            better: headers[i].includes('downarrow') ? 'lower' : 'higher' };
        });
        results.set(model, metrics);
      }
    }
    return checked(Array.from(results, ([model, metrics]) => {
      if (Object.keys(metrics).length !== interaction.length + memory.length) throw Error('Incomplete interaction and memory row');
      return { model, score: metrics.cFD, metrics };
    }), 5);
  },
};
export default board;

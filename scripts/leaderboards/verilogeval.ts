// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// VerilogEval tests whether generated Verilog passes simulation against reference implementations.
// The Chip Design LLM Zoo CSV reports pass@1 on the machine-written and human-written v1 descriptions.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://iprc-dip.github.io/Chip-Design-LLM-Zoo/';
const feed = url + 'results_verilog.csv';
const board: Leaderboard = {
  benchmark: 'verilogeval', url, feed, host: 'Chip Design LLM Zoo',
  terms: 'The board credits each result to its linked publication. https://iprc-dip.github.io/Chip-Design-LLM-Zoo/',
  headline: 'The leaderboard reports no overall v1 pass@1, so the headline is the plain mean of the machine and human suite scores.',
  parts: { machine: 'VerilogEval-machine', human: 'VerilogEval-human' },
  harnesses: 'system',
  async fetch() {
    const table = parseCsv((await fetchText(feed)).replace(/^\uFEFF/, ''));
    if (!table.length || !['model_name', 'verilogeval_machine', 'verilogeval_human'].every(k => k in table[0])) throw Error('VerilogEval v1 columns missing');
    // The leaderboard stores records by model name, so its last CSV entry wins for a repeated name.
    const models = new Map(table.map(row => [row.model_name, row]));
    const rows = [...models.values()].flatMap(row => {
      const cells = [row.verilogeval_machine, row.verilogeval_human];
      if (cells.some(value => value === '' || value === 'null')) return [];
      if (!cells.every(value => /^\d+(?:\.\d+)?$/.test(value))) throw Error('Invalid pass@1 for ' + row.model_name);
      const [machine, human] = cells.map(Number);
      const system = row.model_name.match(/^(VeriMind|VeriAssist)-(.+)$/);
      return [{ model: system?.[2] ?? row.model_name, harness: system?.[1], score: (machine + human) / 2,
        metrics: { machine, human }, params: Number(row.size) > 0 ? Number(row.size) : undefined,
        link: row.link.startsWith('https://') ? row.link : undefined }];
    });
    return checked(rows, 85);
  },
};
export default board;

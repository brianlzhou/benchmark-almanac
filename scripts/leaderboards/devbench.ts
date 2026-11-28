// DevBench evaluates software development. The makers' two README tables report pass rates,
// code coverage and pairwise design wins. The headline is the first measure, environment setup.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/open-compass/DevEval/HEAD/README.md';
const parts = {
  setup: 'Environment Setup: Pass@ Example Usage', implementationAcceptance: 'Implementation: Pass@ Acceptance Test',
  implementationUnit: 'Implementation: Pass@ Unit Test', acceptance: 'Acceptance Testing: Oracle Test',
  unit: 'Unit Testing: Oracle Test', coverage: 'Unit Testing: Coverage', validCoverage: 'Coverage on valid repositories',
  generalTie: 'General Principles with ties', faithfulTie: 'Faithfulness with ties',
  general: 'General Principles without ties', faithful: 'Faithfulness without ties',
};
const board: Leaderboard = {
  benchmark: 'devbench', url: 'https://github.com/open-compass/DevEval', feed, parts,
  terms: 'The authors license the data under CC BY 4.0. https://github.com/open-compass/DevEval#-license',
  headline: 'The authors report several different measures, so the headline is the first, the environment setup pass rate.',
  aliases: { 'GPT-4-Turbo-1106': 'gpt-4-turbo-nov-2023', 'GPT-4-Turbo-0125': 'gpt-4-turbo-jan-2024' },
  async fetch() {
    const html = (await fetchText(feed)).replace(/(<\/td>)\s*(<tr>)/gi, '$1</tr>$2');
    const [coding, design] = tables(html).map(grid);
    if (coding?.[1].join('|') !== 'Model|Pass@ Example Usage§|Pass@ Accept. Test¶|Pass@ Unit Test¶|Oracle Test§|Oracle Test§|Coverage$'
      || design?.[1].join('|') !== 'Model|General Principles†|Faithfulness‡|General Principles|Faithfulness') throw Error('Missing DevBench columns');
    const rows = coding.slice(2).map(([model, ...cells]) => {
      const cover = cells.at(-1)?.match(/^([\d.]+)\(([\d.]+)\)$/);
      if (!cover || cells.length !== 6) throw Error('Invalid coding results for ' + model);
      const values = [...cells.slice(0,5).map(x => x.replace('♡','')), cover[1], cover[2]];
      const designRow = design.find(r => r[0] === model);
      if (designRow) values.push(...designRow.slice(1));
      if (values.some(v => !v || !Number.isFinite(Number(v)))) throw Error('Invalid metric for ' + model);
      const metrics = Object.fromEntries(values.map((v,i) => [Object.keys(parts)[i], Number(v)]));
      return { model, score: metrics.setup, metrics };
    });
    return checked(rows, 9);
  },
};
export default board;

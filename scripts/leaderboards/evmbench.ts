// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// EVMbench evaluates smart-contract auditing. Table 9 reports percentage scores and confidence intervals for each task mode.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://cdn.openai.com/evmbench/evmbench.pdf';
const modes = ['Detect','Patch','Exploit'];
const board: Leaderboard = {
  benchmark:'evmbench', url:'https://openai.com/index/introducing-evmbench/', feed, static:'paper',
  terms:'OpenAI and Paradigm publish Table 9 in their paper. https://openai.com/policies/terms-of-use/',
  stats: Object.fromEntries(['Detect High','Detect Low','Exploit High','Exploit Low','Patch High','Patch Low'].map(k => [k, { name: k + ' score', unit: '%', better: 'higher' }])),
  headline:'The paper reports no overall score, so the headline is the plain mean of its Detect, Patch and Exploit percentages.',
  parts:Object.fromEntries(modes.map(m => [m,m])),
  async fetch() {
    const section = (await pdfText(feed)).split('Table 9: Full results across all task modes.')[1]?.trim().split(/\n\s*\n/)[0];
    const [header, subheader, ...body] = section?.split('\n') ?? [];
    if (header?.trim().split(/\s{2,}/).join('|') !== 'Model|Detect (%)|Patch (%)|Exploit (%)' ||
        subheader?.trim().split(/\s+/).join('|') !== 'Mean|CI|Mean|CI|Mean|CI') throw new Error('EVMbench Table 9 columns changed');
    const rows = body.map(line => {
      const [label, ...cells] = line.trim().split(/\s{2,}/);
      const match = label.match(/^(.*?)(?: \((\w+) reasoning(?:, default)?\))?$/);
      if (!match || cells.length !== 6) throw new Error('Invalid EVMbench row: ' + line);
      const model = match[1].replace(/^OC-/,'');
      const harness = label.startsWith('OC-') ? 'OpenCode' : model.startsWith('Claude') ? 'Claude Code' :
        model.startsWith('Gemini') ? 'Gemini CLI' : 'Codex CLI';
      const metrics: Record<string,number> = {};
      modes.forEach((mode,i) => {
        const bounds = cells[2*i+1].match(/^(\d+\.\d+)–(\d+\.\d+)$/);
        if (!bounds) throw new Error('Invalid EVMbench interval: ' + cells[2*i+1]);
        metrics[mode] = Number(cells[2*i]);
        metrics[mode+' Low'] = Number(bounds[1]);
        metrics[mode+' High'] = Number(bounds[2]);
      });
      return {model, harness, setting:match[2], score:modes.reduce((sum,m) => sum+metrics[m],0)/3, metrics};
    });
    return checked(rows,14);
  },
};
export default board;

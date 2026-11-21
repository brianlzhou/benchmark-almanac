// RealCompanion tests whether agents reconstruct a person's profile and persona from long conversations.
// Table 6 reports persona F1 pooled over ten participants. Tables 42 and 44 give run ranges, profile scores and token costs.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.01780';
const number = (s: string) => {
  const m = s.replaceAll(',', '').match(/^(\d+(?:\.\d+)?)([kM])?$/);
  if (!m) throw new Error('Invalid RealCompanion value: ' + s);
  return Number(m[1]) * (m[2] === 'M' ? 1e6 : m[2] === 'k' ? 1e3 : 1);
};
export default {
  benchmark: 'realcompanion', static: 'paper', url, feed: url, harnesses: 'system',
  terms: 'The authors publish their aggregate tables on arXiv. https://arxiv.org/abs/2610.01780',
  headline: 'The headline is persona reconstruction F1 across ten participants, expressed as a percentage.',
  parts: { personaF1: 'Persona reconstruction F1', profileF1: 'Profile reconstruction F1' },
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'System|F1|Precision|Recall|Tokens processed|Run agreement');
    const ranges = tables.find(t => t[0]?.join('|') === 'System|Layer|F1|Precision|Recall|Runs agree');
    const costs = tables.find(t => t[1]?.join('|') === 'System|calls|processed|output|calls|processed|output');
    if (!main || !ranges || !costs) throw new Error('Missing RealCompanion reconstruction tables');
    return checked(main.slice(1).map(([system, f1, precision, recall, , agreement]) => {
      const first = system.split(' ')[0];
      const model = system.replace(/^(Codex|Antigravity) /, '');
      const i = ranges.findIndex(r => r[0] === first && r[1] === 'persona');
      const cost = costs.find(r => r[0] === first);
      if (i < 0 || ranges[i+1]?.[1] !== 'profile' || cost?.length !== 7) throw new Error('Missing results for ' + system);
      const metrics: Record<string, number> = { personaF1: 100 * number(f1), precision: 100 * number(precision),
        recall: 100 * number(recall), runAgreement: 100 * number(agreement) };
      for (const [j, layer] of ['persona', 'profile'].entries()) {
        const row = ranges[i+j];
        for (const [k, metric] of ['F1', 'Precision', 'Recall'].entries()) {
          const range = row[k+2].match(/^(\S+) \((\S+)[–-](\S+)\)$/);
          if (!range) throw new Error('Missing run range');
          if (layer === 'profile') metrics[layer + metric] = 100 * number(range[1]);
          metrics[layer + metric + 'Min'] = 100 * number(range[2]);
          metrics[layer + metric + 'Max'] = 100 * number(range[3]);
        }
        metrics[layer + 'CallsPerRun'] = number(cost[1 + 3*j]);
        metrics[layer + 'TokensPerRun'] = number(cost[2 + 3*j]);
        metrics[layer + 'OutputTokensPerRun'] = number(cost[3 + 3*j]);
      }
      return { model, ...(first === 'Claude' ? { setting: 'Agent workflow with file tools' } : { harness: first }),
        trials: 3, score: metrics.personaF1, metrics };
    }), 3);
  },
} satisfies Leaderboard;

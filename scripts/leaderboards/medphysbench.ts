// MedPhysBench tests medical physics calculations and error detection. The README ranks calculation accuracy first.
// Worksheet and result checks report detection and false alarms separately.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/onusrat/medphysbench/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'medphysbench', feed, url: 'https://github.com/onusrat/medphysbench#results',
  terms: 'The authors release their code under MIT. https://github.com/onusrat/medphysbench/blob/HEAD/LICENSE',
  headline: 'The source ranks models by calculation accuracy and gives separate detection and false alarm rates.',
  parts: { worksheetDetection: 'Worksheet check detection', resultDetection: 'Result check detection',
    worksheetFalseAlarms: { name: 'Worksheet check false alarms', unit: '%', better: 'lower' },
    resultFalseAlarms: { name: 'Result check false alarms', unit: '%', better: 'lower' } },
  async fetch() {
    const table = (await fetchText(feed)).split('<!-- results:start -->')[1]?.split('<!-- results:end -->')[0];
    if (!table?.includes('| Model | Weights | Calculation (%) | 95% CI | Worksheet check: detected / false alarms (%) | Result check: detected / false alarms (%) |')) throw new Error('Missing Results columns');
    const lines = table.trim().split('\n').slice(2);
    const rows = lines.map(line => {
      const [label, weights, calc, ci, worksheet, result] = line.split('|').slice(1,-1).map(x=>x.trim());
      const accuracy = /^(\d+(?:\.\d+)?)(?: \((\d+(?:\.\d+)?)\))?$/.exec(calc);
      const interval = /^(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)$/.exec(ci);
      const rates = [worksheet, result].map(cell => /^(\d+) \/ (\d+)$/.exec(cell));
      if (!accuracy || !interval || !rates[0] || !rates[1]) throw new Error('Invalid medical physics score');
      const half = label.endsWith('†');
      const metrics: Record<string, number> = {worksheetDetection: +rates[0][1], worksheetFalseAlarms: +rates[0][2],
        resultDetection: +rates[1][1], resultFalseAlarms: +rates[1][2], calculationItems: half ? 300 : 600};
      if (accuracy[2]) metrics.accuracyAmongCompleted = +accuracy[2];
      return {model: label.replace(/†$/, ''), score: +accuracy[1], low: +interval[1], high: +interval[2],
        open: weights === 'open', trials: 1, setting: half ? 'Stratified half, no tools' : 'Full test, no tools', metrics};
    });
    return checked(rows, 12);
  },
};
export default board;

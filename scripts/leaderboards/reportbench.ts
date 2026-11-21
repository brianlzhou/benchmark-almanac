// ReportBench evaluates references and factual claims in generated literature surveys.
// Table 1 in the authors' README reports reference precision first, as a fraction of the cited references.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/ByteDance-BandAI/ReportBench/HEAD/README.md';
export default {
  benchmark: 'reportbench', url: 'https://github.com/ByteDance-BandAI/ReportBench#evaluation-results', feed,
  headline: 'The headline is reference precision, the first measure in the authors’ comparison.',
  terms: 'ReportBench uses Apache 2.0. https://www.apache.org/licenses/LICENSE-2.0',
  stats: { recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Recall stored as a fraction from 0 to 1.' }, averageRefs: { name: 'Average references', unit: 'count' }, citationMatchRate: { name: 'Citation match rate', unit: '%', better: 'higher' }, citedStatements: { name: 'Cited statements', unit: 'count' }, uncitedAccuracy: { name: 'Uncited accuracy', unit: '%', better: 'higher' }, uncitedStatements: { name: 'Uncited statements', unit: 'count' } },
  aliases: { 'claude4-sonnet': 'claude-sonnet-4' },
  async fetch() {
    const block = (await fetchText(feed)).split('## Evaluation Results')[1]?.split('*Table 1.')[0];
    const lines = block?.split('\n').filter(l => l.startsWith('|'));
    const split = (s: string) => s.split('|').slice(1,-1).map(c => c.trim());
    const header = 'Test Model|Precision|Recall|Avg Refs|Cit. Match Rate|Cit. Stmt Count|Non-Cit Acc|Non-Cit Stmt Count';
    if (!lines?.length || split(lines[0]).join('|') !== header) throw new Error('Missing ReportBench Table 1');
    return checked(lines.slice(2).map(line => {
      const [name, ...cells] = split(line);
      if (cells.length !== 7 || cells.some(c => !/^\d+(?:\.\d+)?%?$/.test(c))) throw new Error('Invalid ReportBench row');
      const [score, recall, averageRefs, citationMatchRate, citedStatements, uncitedAccuracy, uncitedStatements] = cells.map(parseFloat);
      const model = name === 'gemini-2.5-flash' ? name + ' (snapshot unspecified)' : name.replaceAll('**', '');
      return { model, score,
        metrics: { recall, averageRefs, citationMatchRate, citedStatements, uncitedAccuracy, uncitedStatements } };
    }), 6);
  },
} satisfies Leaderboard;

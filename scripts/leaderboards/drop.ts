// Read test F1 from the maker paper, including ablations and baselines. Table 6 breaks down development scores by answer type.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/1903.00161';
const board: Leaderboard = {
  benchmark: 'drop', static: 'paper', url: URL, feed: URL + ' (main results, test F1)', terms: PAPER_TERMS,
  stats:{testExactMatch:{name:'Test exact match',unit:'%',better:'higher'},devExactMatch:{name:'Development exact match',unit:'%',better:'higher'},devF1:{name:'Development F1',unit:'%',better:'higher'}},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.join('|') === 'Method|Dev|Dev|Test|Test');
    if (!t) throw new Error('DROP results table missing');
    const breakdown = tables.find(table => table[1]?.slice(2).join('|') === 'QN+|BERT|QN+|BERT');
    const names = ['Majority', 'Q-only', 'P-only', 'Syn Dep', 'OpenIE', 'SRL', 'BiDAF', 'QANet', 'QANet+ELMo', 'BERT',
      '+ Q Span', '+ Count', '+ Add/Sub', 'Complete Model'];
    return names.map(name => {
      const r = t.find(r => r[0] === name);
      if (!r || r.length !== 5 || r.slice(1).some(c => !/^\d+(?:\.\d+)?$/.test(c))) throw new Error(`DROP row missing: ${name}`);
      const metrics: Record<string, number> = {testExactMatch: Number(r[3]), devExactMatch: Number(r[1]), devF1: Number(r[2])};
      if (name === 'BERT' || name === 'Complete Model') {
        const offset = name === 'BERT' ? 1 : 0;
        for (const [type, , ...values] of breakdown?.slice(2) ?? []) {
          metrics['Dev exact match: ' + type] = Number(values[offset]);
          metrics['Dev F1: ' + type] = Number(values[2 + offset]);
        }
      }
      const ablation = name.startsWith('+ ');
      return {model: name === 'Complete Model' || ablation ? 'NAQANet' : name === 'BERT' ? 'BERT (DROP paper baseline)' : name,
        score: Number(r[4]), setting: ablation ? 'supervised; original paper test set; ' + name : 'supervised; original paper test set',
        metrics};
    });
  },
};
export default board;

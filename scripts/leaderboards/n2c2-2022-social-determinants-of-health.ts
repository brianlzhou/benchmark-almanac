// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The shared task extracts social determinants of health from clinical notes. Table 4 gives F1, precision and recall.
// Table 3 and the system descriptions identify the models used by the teams.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2301.05571';
const systems: Record<string, string> = { MS: 'T5-large', PR: 'T5', CHOP: 'ClinicalBERT', UTSA: 'RoBERTa', UFL: 'GatorTron' };
const board: Leaderboard = {
  benchmark: 'n2c2-2022-social-determinants-of-health', url: feed, feed, static: 'paper',
  terms: 'The authors posted this paper under the arXiv publication terms, https://arxiv.org/licenses/nonexclusive-distrib/1.0/.',
  headline: 'The paper reports no combined score, so this is the plain mean of F1 across its three subtasks.',
  parts: { A: 'Subtask A', B: 'Subtask B', C: 'Subtask C' }, harnesses: 'system',
  stats: Object.fromEntries(['A','B','C'].flatMap(k => [[k+'Precision',{name:'Subtask '+k+' precision',unit:'score',better:'higher',note:'Rate from 0 to 1.'}],[k+'Recall',{name:'Subtask '+k+' recall',unit:'score',better:'higher',note:'Rate from 0 to 1.'}]])),
  async fetch() {
    const html = await paperHtml(feed);
    const tables = paperTables(html).map(grid).filter(t => t[0]?.slice(0, 4).join('|') === 'Team|P|R|F1');
    if (tables.length !== 3 || !['(a) Subtask A', '(b) Subtask B', '(c) Subtask C'].every(label => text(html).includes(label)))
      throw new Error('Missing subtask result tables');
    const rows = Object.entries(systems).map(([team, model]) => {
      const metrics: Record<string, number> = {};
      for (const [i, key] of ['A', 'B', 'C'].entries()) {
        const row = tables[i].slice(2).find(c => c[0] === team);
        if (!row || !row.slice(1, 4).every(v => /^0\.\d+$/.test(v))) throw new Error('Missing scores for ' + team);
        metrics[key] = Number(row[3]);
        metrics[key + 'Precision'] = Number(row[1]);
        metrics[key + 'Recall'] = Number(row[2]);
      }
      return { model, submitter: team, harness: team, score: (metrics.A + metrics.B + metrics.C) / 3, metrics };
    });
    return checked(rows, 5);
  },
};
export default board;

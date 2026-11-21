// DETESTS-Dis tests detection and classification of racial stereotypes in Spanish.
// The four rankings use different units and directions. The first is binary F1 for Task 1 with hard labels.
// Section 6 of the organizers' overview identifies the systems: https://hdl.handle.net/2445/219555
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://detests-dis.github.io/evaluation/';
const names: Record<string, string> = {
  BASELINE_beto: 'BETO', BASELINE_tfidf_svc: 'TFIDF+SVC', BASELINE_fast_text_svc: 'FastText+SVC',
  'Brigada Lenguaje_1': 'BETO', 'I2C-Huelva_1': 'RoBERTa-base-bne', 'I2C-Huelva_2': 'BETO',
  'VINE Bias Busters_1': 'BETO', 'VINE Bias Busters_2': 'RoBERTa', 'VINE Bias Busters_3': 'GPT-3.5-Turbo',
};
const board: Leaderboard = {
  benchmark: 'detests-dis-2024', url: feed, feed,
  terms: 'Copyright 2024 DETESTS-Dis IberLEF. https://detests-dis.github.io/evaluation/',
  parts: { soft: { name: 'Task 1 with Soft Labels', unit: 'score', better: 'lower', note: 'Cross entropy.' },
    hardICM: { name: 'Task 2 with Hard Labels', note: 'ICM.' }, hardICMNorm: { name: 'Task 2 with Hard Labels normalized', unit: 'score', better: 'lower', note: 'Normalized ICM.' }, softICM: { name: 'Task 2 with Soft Labels', note: 'ICM Soft.' } },
  async fetch() {
    const result = tables(await fetchText(feed)).map(t => t.map(row => row.filter(c => c.text)));
    const byRun = new Map<string, LeaderboardRow>();
    const specs = [['Rank|Run|F1', 'f1'], ['Rank|Run|Cross Entropy', 'soft'],
      ['Rank|Run|ICM|ICM Norm', 'hardICM'], ['Rank|Run|ICM Soft|ICM Soft Norm', 'softICM']];
    for (const [header, key] of specs) {
      const table = result.find(t => t[0]?.map(c => c.text).join('|') === header);
      if (!table) throw new Error('Missing DETESTS results: ' + header);
      for (const cells of table.slice(1)) {
        const [,run,value,norm] = cells.map(c => c.text);
        if (!names[run]) continue;
        if (!/^-?\d+\.\d+$/.test(value)) throw new Error('Invalid DETESTS score');
        if (key === 'f1') {
          const submitter = run.startsWith('BASELINE') ? 'Organizers' : run.split('_')[0];
          byRun.set(run, { model: names[run], submitter, setting: run, score: Number(value), metrics: {} });
        } else {
          const row = byRun.get(run);
          if (!row) continue;
          row.metrics![key] = Number(value);
          if (norm) row.metrics![key + 'Norm'] = Number(norm);
        }
      }
    }
    return checked([...byRun.values()], 9);
  },
};
export default board;

// CLUE's paper Table 2 reports Avg across all nine tasks: "Avg is the average of all tasks."
// Read the published Avg and the model-specific pretraining configuration. These are static paper baselines, not a refreshing submission board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2004.05986';
const board: Leaderboard = {
  benchmark: 'clue', static: 'paper', parts: {
  TNEWS: { name: 'TNEWS', group: 'Category' },
  IFLYTEK: { name: 'IFLYTEK', group: 'Category' },
  CLUEWSC2020: { name: 'CLUEWSC2020', group: 'Category' },
  AFQMC: { name: 'AFQMC', group: 'Category' },
  CSL: { name: 'CSL', group: 'Category' },
  OCNLI: { name: 'OCNLI', group: 'Category' },
  CMRC: { name: 'CMRC', group: 'Category' },
  ChID: { name: 'ChID', group: 'Category' },
  'C 3': { name: 'C3', group: 'Category' },
}, url: FEED, feed: FEED,
  terms: 'The authors publish this paper on arXiv. Credit the CLUE authors for the reported baseline results.',
  stats: {
    pretrainingBatchSize: { name: 'Pretraining batch size', unit: 'count' },
    pretrainingSteps: { name: 'Pretraining steps', unit: 'count' },
    pretrainingTokens: { name: 'Pretraining tokens', unit: 'tokens' },
    vocabularySize: { name: 'Vocabulary size', unit: 'count' },
  },
  async fetch() {
    const all = tables(await fetchText(FEED));
    const configs = all.find(t=>t[0]?.some(c=>c.text==='Training Steps'));
    const table = all.find(t => t.some(r => r[0]?.text === 'Model' && r[1]?.text === 'Avg'));
    if (!table) throw new Error('CLUE overall table missing');
    const headerAt = table.findIndex(r => r[0]?.text === 'Model' && r[1]?.text === 'Avg');
    const head = table[headerAt].map(c => c.text);
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(headerAt + 1)) {
      const score = num(row[1]?.text);
      if (score === undefined || !row[0]?.text) continue;
      const metrics: Record<string, number> = {};
      for (let i=2; i<head.length; i++) { const n=num(row[i]?.text); if(n!==undefined) metrics[head[i]]=n; }
      const config=configs?.find(r=>r[0]?.text===row[0].text);
      if (config && configs) {
        for (const [label,key] of [['Training Steps','pretrainingSteps'],['Training Tokens #','pretrainingTokens'],
          ['Batch Size','pretrainingBatchSize'],['Vocabulary','vocabularySize']]) {
          const cell=config[configs[0].findIndex(c=>c.text===label)]?.text.replaceAll(',','');
          const m=cell?.match(/^([\d.]+)([kMB]?)$/);
          if (m) metrics[key]=Number(m[1])*({k:1e3,M:1e6,B:1e9}[m[2]] ?? 1);
        }
      }
      rows.push({model: /human/i.test(row[0].text) ? row[0].text : row[0].text + ' (CLUE checkpoint)', score, metrics});
    }
    if (!rows.length) throw new Error('No CLUE baseline scores');
    return rows;
  },
};
export default board;

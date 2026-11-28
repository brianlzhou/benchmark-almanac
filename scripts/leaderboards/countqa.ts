// CountQA ranks vision models by exact-match counting accuracy. The paper supplies bootstrap margins, relaxed accuracy, and results by count range and scene type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2508.06585';

const board: Leaderboard = {
  benchmark: 'countqa', static: 'paper',
  url: 'https://arxiv.org/abs/2508.06585',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Pixtral Large 2411": "pixtral-large", "Mistral-small3.1-24b": "mistral-small-3-1"},
  parts: {
    'subset_1-5': { name: '1-5', group: '# of objects' },
    'subset_6-10': { name: '6-10', group: '# of objects' },
    'subset_11-20': { name: '11-20', group: '# of objects' },
    'subset_21-50': { name: '21-50', group: '# of objects' },
    'subset_51+': { name: '51+', group: '# of objects' },
    subset_Focused: { name: 'Focused', group: 'Subset' },
    subset_Cluttered: { name: 'Cluttered', group: 'Subset' },
  },
  stats: {
    ra5: { name: 'Relaxed accuracy at 5', unit: '%', better: 'higher' },
    ra10: { name: 'Relaxed accuracy at 10', unit: '%', better: 'higher' },
  },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.[1] === 'Parameters' && t[0][2]?.startsWith('EM (%)'));
    if (!main) throw new Error('Missing CountQA table');
    const parse = (s: string) => {
      const m = s.match(/^(\d+(?:\.\d+)?)\s*\\pm\s*(\d+(?:\.\d+)?)$/);
      if (!m) throw new Error('Invalid CountQA interval: ' + s);
      return [Number(m[1]), Number(m[2])];
    };
    const rows: LeaderboardRow[] = main.slice(1).filter(c => !c.every(v => v === c[0])).map(c => {
      const model = c[0].replace(/\s*\[\s*\d+\s*\]/, ''), [score, margin] = parse(c[2]);
      const [ra5, ra5Ci] = parse(c[3]), [ra10, ra10Ci] = parse(c[4]);
      return { model, score, low: +(score-margin).toFixed(2), high: +(score+margin).toFixed(2), ...(c[1].endsWith('B') ? { params: Number(c[1].slice(0,-1)) } : {}), metrics: { ra5, ra5Ci, ra10, ra10Ci } };
    });
    if (rows.length < 15) throw new Error('Incomplete CountQA model table');
    for (const [group, count] of [['# of objects', 5], ['Subset', 2]] as const) {
      const t = tables.find(t => t[0]?.[1] === group && t[0][2]?.startsWith('EM (%)'));
      if (!t || t.length !== rows.length * count + 1) throw new Error('Incomplete CountQA subset table');
      let model = '';
      for (const c of t.slice(1)) {
        model = c[0] || model;
        const row = rows.find(r => r.model === model);
        if (!row) throw new Error('Unknown CountQA subset model');
        const key = 'subset_' + c[1];
        const [score, margin] = parse(c[2]);
        row.metrics![key] = score;
        row.metrics![key+'_ci'] = margin;
      }
    }
    return rows;
  },
};
export default board;

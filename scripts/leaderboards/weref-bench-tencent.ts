// WeRef-Bench evaluates referring object detection with mean F1 and absent-target rejection.
// The headline score is the paper's WeRef-Bench Mean column in percent.
// This importer reads Table 3 of the WeVisOne-VL paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';

const URL = 'https://arxiv.org/html/2610.31329';

const board: Leaderboard = {
  benchmark: 'weref-bench-tencent',
  static: 'paper',
  url: 'https://github.com/Tencent/WeVisOne-VL',
  feed: URL,
  terms: PAPER_TERMS,
  stats: {
    weRefRejection: { name: 'WeRef-Bench rejection rate', unit: '%', better: 'higher', note: 'Correct rejection rate on absent-target questions.' },
    prRejection: { name: 'PR-Bench rejection rate', unit: '%', better: 'higher', note: 'Correct rejection rate on absent-target questions.' },
    prMean: { name: 'PR-Bench mean F1', unit: '%', better: 'higher' },
    humanRef: { name: 'HumanRef mean F1', unit: '%', better: 'higher' },
    refAdv: { name: 'Ref-Adv mean F1', unit: '%', better: 'higher' },
    dvg: { name: 'DVG mean F1', unit: '%', better: 'higher' },
    refL4: { name: 'Ref-L4 mean F1', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = (await paperTables(URL))[14];
    if (!table?.some(row => row.some(cell => cell.text === 'WeRef-Bench'))) throw new Error('WeRef-Bench Table 3 missing');
    const rows = table.slice(2).filter(row => row.length === 12 && !/^(Specialized Detectors|Vision-Language Models)$/.test(row[0]?.text ?? '')).map(row => {
      const model = paperModel(row[0].text);
      const score = num(row[4].text);
      if (!model || score === undefined) throw new Error('WeRef-Bench Table 3 has an incomplete row');
      return {
        model,
        score,
        metrics: {
          weRefRejection: num(row[3].text)!,
          prRejection: num(row[5].text)!,
          prMean: num(row[6].text)!,
          humanRef: num(row[7].text)!,
          refAdv: num(row[8].text)!,
          dvg: num(row[9].text)!,
          refL4: num(row[10].text)!,
        },
      };
    });
    return checked(rows, 9);
  },
};

export default board;

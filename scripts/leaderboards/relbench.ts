// RelBench (Robinson et al., NeurIPS 2024, arXiv:2407.20060) benchmarks machine learning models on prediction
// tasks over multi-table relational databases. The live RelBench self-reported leaderboard currently has no
// entries, so this static paper importer parses Table 3 from the official paper: Entity Classification AUROC
// (%) across all twelve RelBench tasks and the paper's reported Test average, with all twelve test task AUROCs
// and validation average kept in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2407.20060';

const TASKS: [string, string, string][] = [
  ['rel-amazon/user-churn', 'amazonUserChurn', 'rel-amazon: user-churn'],
  ['rel-amazon/item-churn', 'amazonItemChurn', 'rel-amazon: item-churn'],
  ['rel-avito/user-visits', 'avitoUserVisits', 'rel-avito: user-visits'],
  ['rel-avito/user-clicks', 'avitoUserClicks', 'rel-avito: user-clicks'],
  ['rel-event/user-repeat', 'eventUserRepeat', 'rel-event: user-repeat'],
  ['rel-event/user-ignore', 'eventUserIgnore', 'rel-event: user-ignore'],
  ['rel-f1/driver-dnf', 'f1DriverDnf', 'rel-f1: driver-dnf'],
  ['rel-f1/driver-top3', 'f1DriverTop3', 'rel-f1: driver-top3'],
  ['rel-hm/user-churn', 'hmUserChurn', 'rel-hm: user-churn'],
  ['rel-stack/user-engagement', 'stackUserEngagement', 'rel-stack: user-engagement'],
  ['rel-stack/user-badge', 'stackUserBadge', 'rel-stack: user-badge'],
  ['rel-trial/study-outcome', 'trialStudyOutcome', 'rel-trial: study-outcome'],
];

const KEY_BY_TASK = new Map(TASKS.map(([t, k]) => [t, k]));

const parts: Record<string, BoardPart> = {
  valAverage: { name: 'Validation average AUROC', group: 'Split', unit: '%' },
  ...Object.fromEntries(TASKS.map(([, k, name]) => [k, { name, group: 'Entity classification task', unit: '%' }])),
};

function firstNum(cell?: string): number | undefined {
  const m = (cell ?? '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

const board: Leaderboard = {
  benchmark: 'relbench',
  url: 'https://star-project.stanford.edu/relbench/',
  feed: `${FEED} (Table 3, Entity Classification AUROC)`,
  static: 'paper',
  terms: 'arXiv permits automated reading of HTML papers under robots.txt. Paper tables are attributed to their authors. https://arxiv.org/abs/2407.20060',
  headline: 'Test average AUROC across all twelve RelBench entity classification tasks from Table 3, with per-task test AUROCs and validation average kept in parts.',
  parts,
  async fetch() {
    const html = await paperHtml(FEED);
    const tbl = paperTables(html)
      .map(grid)
      .find((t) => t[0]?.includes('LightGBM') && t[0]?.includes('RDL') && t.some((r) => r.includes('rel-amazon') && r.includes('user-churn')));
    if (!tbl) throw new Error('RelBench Table 3 missing from arXiv HTML');

    const header = tbl[0];
    const lgbIdx = header.indexOf('LightGBM');
    const rdlIdx = header.indexOf('RDL');
    const splitIdx = header.indexOf('Split');
    if (lgbIdx < 0 || rdlIdx < 0 || splitIdx < 0) throw new Error('Unexpected RelBench Table 3 header');

    const lgbMetrics: Record<string, number> = {};
    const rdlMetrics: Record<string, number> = {};
    let lgbTestAvg: number | undefined;
    let rdlTestAvg: number | undefined;
    let curDataset = '';
    let curTask = '';

    for (const r of tbl.slice(1)) {
      const ds = (r[0] ?? '').trim();
      const task = (r[1] ?? '').trim();
      const split = (r[splitIdx] ?? '').trim();
      if (ds && ds !== curDataset && !/^Val|Test$/i.test(ds)) curDataset = ds;
      if (task && task !== curTask && !/^Val|Test$/i.test(task)) curTask = task;
      const lgb = firstNum(r[lgbIdx]);
      const rdl = firstNum(r[rdlIdx]);
      if (lgb === undefined || rdl === undefined) continue;

      if (/^Average$/i.test(curDataset) || /^Average$/i.test(r[0] ?? '') || /^Average$/i.test(r[1] ?? '')) {
        if (/^Test$/i.test(split)) {
          lgbTestAvg = lgb;
          rdlTestAvg = rdl;
        } else if (/^Val$/i.test(split)) {
          lgbMetrics.valAverage = lgb;
          rdlMetrics.valAverage = rdl;
        }
        continue;
      }

      if (/^Test$/i.test(split)) {
        const key = KEY_BY_TASK.get(`${curDataset}/${curTask}`);
        if (key) {
          lgbMetrics[key] = lgb;
          rdlMetrics[key] = rdl;
        }
      }
    }

    if (lgbTestAvg === undefined || rdlTestAvg === undefined || Object.keys(lgbMetrics).length < 13) {
      throw new Error(`Incomplete RelBench Table 3 parse: ${Object.keys(lgbMetrics).length} metrics`);
    }

    const rows: LeaderboardRow[] = [
      { model: 'RDL', score: rdlTestAvg, metrics: rdlMetrics },
      { model: 'LightGBM', score: lgbTestAvg, metrics: lgbMetrics },
    ];
    return rows;
  },
};

export default board;

// This benchmark tests whether a robot chooses camera views that help it complete a commanded task.
// Table 1 scores the authors' named belief policies. Tables 8 and 9 give foundation-model success, intervals and task results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2611.09794';
const tasks = ['Tamp', 'Insert', 'Place', 'Serve', 'Grind'];
const board: Leaderboard = {
  benchmark: 'seeing-what-execution-needs', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(tasks.map(t => [t, t])),
  stats: {
    target: {name: 'Target success', unit: '%', better: 'higher'},
    wrong: {name: 'Wrong selection rate', unit: '%', better: 'lower'},
    selectivity: {name: 'View selectivity', unit: '%', better: 'higher'},
    collision: {name: 'Collision rate', unit: '%', better: 'lower'},
    postFail: {name: 'Post-failure rate', unit: '%', better: 'lower'},
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.slice(0,6).join('|') === 'Methods|' + tasks.join('|'));
    const diag = tables.find(t => t[0]?.[0] === 'Model' && t[0]?.[1]?.startsWith('Success') && t[0]?.[7] === 'n');
    const split = tables.find(t => t[0]?.join('|') === 'Strict-clean VLM|' + tasks.join('|') + '|Overall');
    if (!main || !diag || !split) throw Error('Missing execution success tables');
    function value(s: string) {
      if (!/^-?\d+(?:\.\d+)?$/.test(s)) throw Error('Invalid result: ' + s);
      return Number(s);
    }
    function scores(cells: string[]) {
      return Object.fromEntries(tasks.map((task, i) => [task, value(cells[i+1])]));
    }
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const c of main) {
      if (c[0].startsWith('C.')) setting = c[0];
      if (!['View Belief Map', 'VBM+AIBR'].includes(c[0])) continue;
      const keys = setting.startsWith('C.1:') ? ['collision', 'postFail', 'views'] : ['target', 'wrong', 'selectivity'];
      rows.push({ model: c[0], setting, score: value(c[6]), metrics: { ...scores(c),
        ...Object.fromEntries(keys.map((key, i) => [key, value(c[7+i])])) } });
    }
    for (const [model, overall, target, wrong, selectivity, collision, postFail, count] of diag.slice(1)) {
      const c = split.slice(1).find(r => r[0] === model);
      const interval = overall.match(/^(\d+\.\d+)\\pm\s*(\d+\.\d+)$/);
      if (!c || !interval || c[6].replaceAll('\\!', '').replaceAll(' ', '') !== overall.replaceAll(' ', '')) throw Error('Tables 8 and 9 disagree');
      const score = value(interval[1]), half = value(interval[2]);
      rows.push({ model, setting: 'Strict-clean foundation-model view scoring', score,
        low: score-half, high: score+half, trials: value(count.replaceAll(',', '')),
        metrics: { ...scores(c), target: value(target), wrong: value(wrong), selectivity: value(selectivity),
          collision: value(collision), postFail: value(postFail) } });
    }
    return checked(rows, 11);
  },
};
export default board;

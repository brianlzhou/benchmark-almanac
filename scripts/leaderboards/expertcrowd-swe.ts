// ExpertCrowd-SWE tests coding agents on expert-authored software changes. Table 3 gives mean task reward in percent.
// Five runs contribute per task. Gemini has only 99 scored tasks. Confidence intervals are over tasks.
// Tables 2 and 6 give the reasoning setting and mean steps for each model.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.13246';
const board: Leaderboard = {
  stats: { runCI: { name: 'Run confidence interval', unit: 'score' }, fullCreditRunsPercent: { name: 'Full-credit runs', unit: '%', better: 'higher' }, tasksAnyFull: { name: 'Tasks with any full-credit run', unit: 'count' }, tasksAllFull: { name: 'Tasks with all full-credit runs', unit: 'count' }, steps: { name: 'Steps', unit: 'count' }, medianContainerMinutes: { name: 'Median container time', unit: 'minutes', better: 'lower' }, tasks: { name: 'Tasks', unit: 'count' } },
  benchmark: 'expertcrowd-swe', url: feed, feed, reference: ['HUD'],
  terms: 'Results are credited to Toptal ExpertCrowd under the paper terms. https://arxiv.org/abs/2611.13246',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.find(t => t[0]?.includes('Score (95% CI)') && t[0]?.includes('Within-task SD'));
    const settings = tables.find(t => t[0]?.includes('Reasoning') && t[0]?.includes('Max output'));
    const effort = tables.find(t => t[0]?.includes('Mean steps') && t[0]?.includes('Median container time'));
    if (!results || !settings || !effort) throw new Error('Missing ExpertCrowd-SWE result columns');
    return checked(results.slice(1).map(([name, interval, runInterval, full, tasks, sd]) => {
      const model = name.replace(/ a$/, '');
      const setting = settings.find(r => r[0] === model)?.[3];
      const stats = effort.find(r => r[0] === model);
      const ci = interval.match(/^([\d.]+)\\pm ([\d.]+)$/);
      if (!setting || !stats || !ci) throw new Error('Incomplete ExpertCrowd result for ' + model);
      const score = Number(ci[1]), width = Number(ci[2]);
      const [anyFull, allFull] = tasks.split(' / ').map(Number);
      const metrics = { runCI: Number(runInterval.replace('\\pm ', '')), std: Number(sd),
        fullCreditRunsPercent: Number(full.replace('%','')), tasksAnyFull: anyFull, tasksAllFull: allFull,
        steps: Number(stats[3]), medianContainerMinutes: Number(stats[4].replace(' min', '')), tasks: name.endsWith(' a') ? 99 : 100 };
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid run statistics');
      return { model, setting, harness: 'HUD', score, low: score-width, high: score+width, trials: 5, metrics };
    }), 7);
  },
};
export default board;

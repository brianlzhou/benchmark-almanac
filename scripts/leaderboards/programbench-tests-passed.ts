// ProgramBench tests passed: the share of hidden behavioral tests a run's rebuilt program passes, averaged over the
// 200 tasks. programbench.com plots it in its chart as "% Test Passed (Unofficial Metric)", and labs report this
// number in their model cards. The official leaderboard ranks runs by Resolved, the share of tasks whose every
// test passes, which the programbench record holds. This importer reads the same page through programbench.ts and
// makes the chart's number the score, with Resolved kept in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
import programbench from './programbench.ts';

const board: Leaderboard = {
  benchmark: 'programbench-tests-passed',
  url: programbench.url,
  feed: programbench.feed,
  terms: programbench.terms,
  aliases: programbench.aliases,

  async fetch(): Promise<LeaderboardRow[]> {
    const rows = await programbench.fetch();
    const html = await fetchText(programbench.url);
    const points = JSON.parse(html.match(/var results = (\[[\s\S]*?\]);/)?.[1] ?? '[]') as {model: string; slug: string; cost_is_estimate?: boolean}[];
    const result: LeaderboardRow[] = [];
    board.parts = {};
    for (const r of rows) {
      const passed = r.metrics?.testsPassed;
      if (typeof passed !== 'number') continue;
      const { testsPassed: _, ...rest } = r.metrics ?? {};
      const metrics: Record<string, number> = { ...rest, resolved: r.score };
      const point = points.find(p => p.model === r.model);
      let link: string | undefined;
      if (point && /^[a-z0-9-]+$/.test(point.slug) && html.includes('data-href="/run/' + point.slug + '/"')) {
        link = new URL('/run/' + point.slug + '/', programbench.url).href;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const page = await fetchText(link);
        const table = tables(page).find(t => t[0]?.some(c => c.text === 'Repository'));
        const languages = new Map<string, number[]>();
        for (const cells of table?.slice(1) ?? []) {
          const task = cells[1]?.html.match(/href="\/task\/([^"/]+)\/"/)?.[1];
          const score = num(cells[3]?.attrs['data-val']);
          if (!task || score === undefined) continue;
          metrics['task:' + task] = 100 * score;
          board.parts['task:' + task] = { name: cells[1].attrs['data-val'] ?? task, group: 'Instance' };
          const language = cells[2]?.attrs['data-val'];
          if (language) {
            const values = languages.get(language) ?? [];
            values.push(score);
            languages.set(language, values);
          }
          for (const [key, index] of [['cost', 4], ['calls', 5]] as const) {
            const value = num(cells[index]?.attrs['data-val']);
            if (value !== undefined) metrics[key + ':' + task] = value;
          }
        }
        for (const [language, scores] of languages) {
          metrics['language:' + language] = 100 * scores.reduce((sum, score) => sum + score, 0) / scores.length;
          board.parts['language:' + language] = { name: language, group: 'Language', note: 'Mean across reported instances.' };
        }
        if (typeof point.cost_is_estimate === 'boolean') metrics.costEstimated = Number(point.cost_is_estimate);
      }
      if (typeof r.tokens === 'number') metrics.reportedTokensPerTask = r.tokens;
      result.push({ ...r, tokens: undefined, link, score: passed, metrics });
    }
    return result;
  },
};
export default board;

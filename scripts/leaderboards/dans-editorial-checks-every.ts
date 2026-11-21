// Dan's Editorial Checks is an editorial benchmark with six writing tasks and six model entries.
// The headline is each model's overall percentage across the completed tasks, with task percentages in metrics.
// This importer reads the scoreboard JSON embedded in the public Every page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE = 'https://checks.every.to/p/dans-editorial-checks';
const taskKeys = ['articleOpeningFeedback', 'personalBenchmarkParagraphFirstDraft', 'personalBenchmarkParagraphRevision', 'tendFeedCardWriting', 'literaryAnalysisFollowUp', 'fullDraftEditorialPerspectivesAndCritique'];
const board: Leaderboard = {
  benchmark: 'dans-editorial-checks-every', url: PAGE, feed: `${PAGE} (the data-page=root scoreboard JSON)`,
  terms: 'Every publishes the public scoreboard page. The page gives no separate score reuse license. Results are credited to Every.',
  parts: Object.fromEntries(taskKeys.map((key, i) => [key, { name: ['Article opening feedback', 'Personal benchmark paragraph first draft', 'Personal benchmark paragraph revision', 'Tend feed-card writing', 'Literary analysis follow-up', 'Full-draft editorial perspectives and critique'][i], group: 'Task' }])),
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const raw = html.match(/<script data-page="root" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('Dan’s Editorial Checks: scoreboard JSON missing');
    const page = JSON.parse(raw) as { props?: { grid?: { rows?: Array<{ name?: string; overall?: { score?: string }; cells?: Array<{ score?: string }> }> } } };
    const sourceRows = page.props?.grid?.rows ?? [];
    if (sourceRows.length !== 6) throw new Error(`Dan’s Editorial Checks: ${sourceRows.length} rows, expected 6`);
    return sourceRows.map((source) => {
      if (!source.name || !source.overall?.score || !source.cells || source.cells.length !== 6) throw new Error('Dan’s Editorial Checks: incomplete row');
      const score = Number(source.overall.score.replace('%', '')); if (!Number.isFinite(score)) throw new Error(`Dan’s Editorial Checks: invalid score for ${source.name}`);
      const metrics: Record<string, number> = {}; source.cells.forEach((cell, i) => { if (cell.score) metrics[taskKeys[i]] = Number(cell.score.replace('%', '')); });
      return { model: source.name, score, metrics };
    });
  },
};
export default board;

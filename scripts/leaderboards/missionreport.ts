// MissionReport (micro1). A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["mission-report"], read as data. Its default tab,
// Mean score (0 to 100), is the score, and its second tab provides Best@3 score. The embedded report script also
// supplies per-report-family scores (Figure 14), Table 2 summary stats, penalties (Figure 9), and Figure 12's
// Score against tool calls per report scatter plot for the report's core models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const PAGE = 'https://www.micro1.ai/benchmark/mission-report';

interface ReportModel {
  n: string;
  mean: number;
  best?: number;
  worst?: number;
  med?: number;
  won?: string | number;
  min?: number;
  calls?: number;
}

const FAM_KEYS = ['war', 'aar', 'psr', 'par'] as const;

const board: Leaderboard = {
  benchmark: 'missionreport',
  parts: {
    war: { name: 'Weekly activity', group: 'Report family' },
    aar: { name: 'After-action', group: 'Report family' },
    psr: { name: 'Program status', group: 'Report family' },
    par: { name: 'Performance and accomplishment', group: 'Report family' },
  },
  stats: {
    bestAt3: { name: 'Best of three', unit: '%', better: 'higher' },
    worstAt3: { name: 'Worst of three', unit: '%', better: 'higher' },
    medianScore: { name: 'Median report', unit: '%', better: 'higher' },
    tasksWon: { name: 'Tasks won', unit: 'count', better: 'higher' },
    medianMinutes: { name: 'Median working time', unit: 'minutes', better: 'lower' },
    toolCalls: { name: 'Median tool calls per report', unit: 'count', better: 'lower' },
    penalties: { name: 'Penalties triggered', unit: 'count', better: 'lower' },
  },
  chart: {
    title: 'Score against tool calls per report',
    x: { key: 'toolCalls', label: 'Median tool calls per report', unit: 'calls', better: 'lower' },
    y: { key: 'score', label: 'Mean score', unit: '%', better: 'higher' },
    note: 'Each model median tool calls per report plotted against its mean score, matching Figure 12.',
  },
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "mission-report", Mean score, Best@3 tab, and embedded report data)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch(): Promise<LeaderboardRow[]> {
    const [rows, bestRows, html] = await Promise.all([
      micro1Data(PAGE, 'mission-report'),
      micro1Data(PAGE, 'mission-report', 'best'),
      fetchText(PAGE),
    ]);
    const bestMap = new Map(bestRows.map((r) => [r.model, r.score]));
    const reportAt = html.indexOf('MODELS=[{n:');
    let models: ReportModel[] = [];
    let famModel: number[][] = [];
    let penN: number[] = [];
    if (reportAt >= 0) {
      const end = html.indexOf('</script>', reportAt);
      const script = html.slice(reportAt, end > reportAt ? end : undefined).replace(/:\.(\d)/g, ':0.$1');
      models = jsLiteral<ReportModel[]>(script, script.indexOf('['));
      const fmAt = script.indexOf('FAM_MODEL=');
      if (fmAt >= 0) famModel = jsLiteral<number[][]>(script, script.indexOf('[', fmAt));
      const pnAt = script.indexOf('PEN_N=');
      if (pnAt >= 0) penN = jsLiteral<number[]>(script, script.indexOf('[', pnAt));
    }
    return rows.map((row) => {
      const metrics: Record<string, number> = { ...(row.metrics ?? {}) };
      const bestTab = bestMap.get(row.model);
      if (typeof bestTab === 'number' && Number.isFinite(bestTab)) metrics.bestAt3 = bestTab;
      const idx = models.findIndex((m) => m.n.replace(/[\s*†‡]+$/u, '').trim() === row.model && m.mean === row.score);
      if (idx >= 0) {
        const m = models[idx];
        if (metrics.bestAt3 === undefined && typeof m.best === 'number') metrics.bestAt3 = m.best;
        if (typeof m.worst === 'number') metrics.worstAt3 = m.worst;
        if (typeof m.med === 'number') metrics.medianScore = m.med;
        const won = Number(m.won);
        if (Number.isFinite(won)) metrics.tasksWon = won;
        if (typeof m.min === 'number') metrics.medianMinutes = m.min;
        if (typeof m.calls === 'number') metrics.toolCalls = m.calls;
        if (typeof penN[idx] === 'number') metrics.penalties = penN[idx];
        const fams = famModel[idx];
        if (fams) {
          FAM_KEYS.forEach((k, j) => {
            if (typeof fams[j] === 'number' && Number.isFinite(fams[j])) metrics[k] = fams[j];
          });
        }
      }
      return Object.keys(metrics).length ? { ...row, metrics } : row;
    });
  },
};
export default board;

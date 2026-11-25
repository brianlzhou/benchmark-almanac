// GradeBench's whole-set exact rubric match. JavaScript literals are read, never executed.
// lo/hi are observed extremes of five runs, not confidence limits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = 'https://gradebench.com/data.js';
const subjectColumns = ['Engineering', 'Chemistry', 'Mathematics', 'Physics', 'Statistics', 'Computer Science'];
const drawingColumns = ['Graphs and plots', 'Chemical structures', 'Circuits and timing', 'Orbital and energy levels', 'Trees and graphs', 'Free-body', 'Ray diagrams'];
const stats = Object.fromEntries([
  ['worstOf5', { name: 'Worst of 5 runs', unit: '%', better: 'higher' }],
  ['bestOf5', { name: 'Best of 5 runs', unit: '%', better: 'higher' }],
  ...subjectColumns.flatMap(name => [
    [`subjects_${name}_worstOf5`, { name: `${name} worst of five score`, unit: 'score', better: 'higher' }],
    [`subjects_${name}_bestOf5`, { name: `${name} best of five score`, unit: 'score', better: 'higher' }],
  ]),
  ...drawingColumns.flatMap(name => [
    [`drawings_${name}_worstOf5`, { name: `${name} worst of five score`, unit: 'score', better: 'higher' }],
    [`drawings_${name}_bestOf5`, { name: `${name} best of five score`, unit: 'score', better: 'higher' }],
  ]),
]);
const board: Leaderboard = {
  benchmark: 'gradebench', parts: {
  subjects_Engineering: { name: 'Engineering', group: 'Domain' },
  subjects_Chemistry: { name: 'Chemistry', group: 'Domain' },
  subjects_Mathematics: { name: 'Mathematics', group: 'Domain' },
  subjects_Physics: { name: 'Physics', group: 'Domain' },
  subjects_Statistics: { name: 'Statistics', group: 'Domain' },
  'subjects_Computer Science': { name: 'Computer science', group: 'Domain' },
  subjects_Drawings: { name: 'Drawings', group: 'Modality' },
  subjects_Written: { name: 'Written', group: 'Modality' },
  'drawings_Graphs and plots': { name: 'Graphs and plots', group: 'Category' },
  'drawings_Chemical structures': { name: 'Chemical structures', group: 'Category' },
  'drawings_Circuits and timing': { name: 'Circuits and timing', group: 'Category' },
  'drawings_Orbital and energy levels': { name: 'Orbital and energy levels', group: 'Category' },
  'drawings_Trees and graphs': { name: 'Trees and graphs', group: 'Category' },
  'drawings_Free-body': { name: 'Free-body', group: 'Category' },
  'drawings_Ray diagrams': { name: 'Ray diagrams', group: 'Category' },
  'drawings_All drawings': { name: 'All drawings', group: 'Category' },
}, url: 'https://gradebench.com/', feed: FEED,
  terms: 'GradeBench publishes this results file. Its robots.txt permits this path and the site states no separate scraping restriction. Source: GradeBench by Pensive.',
  aliases: { 'Muse Wonder': 'muse-wonder' },
  stats,
  chart: {
    title: 'Exact rubric match vs. cost',
    x: { key: 'cost', label: 'Cost per answer', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Exact rubric match', unit: '%', better: 'higher' },
    note: 'GradeBench plots exact rubric match against grading cost.',
  },
  async fetch() {
    const source = await fetchText(FEED);
    const read = <T>(name: string): T => {
      const marker = `export const ${name} = `;
      const at = source.indexOf(marker);
      if (at < 0) throw new Error(`GradeBench ${name} missing`);
      return jsLiteral<T>(source, at + marker.length);
    };
    const models = read<{model: string; exact: number; lo: number; hi: number; cost: number; tokens: number}[]>('MODELS');
    const breakdowns = read<Record<string, {columns: [string, number][]; rows: Record<string, number[]>; ranges?: Record<string, ([number, number] | null)[]>}>>('BREAKDOWNS');
    const rows: LeaderboardRow[] = models.map(r => {
      const metrics: Record<string, number> = {worstOf5: r.lo, bestOf5: r.hi};
      for (const [kind, b] of Object.entries(breakdowns)) {
        b.rows[r.model]?.forEach((value, i) => {
          const key = `${kind}_${b.columns[i][0]}`;
          metrics[key] = value;
          const range = b.ranges?.[r.model]?.[i];
          if (range) { metrics[`${key}_worstOf5`] = range[0]; metrics[`${key}_bestOf5`] = range[1]; }
        });
      }
      return {model: r.model, score: r.exact, trials: 5, setting: 'single-shot user prompt, medium reasoning or nearest supported level', cost: r.cost / 1000, tokens: r.tokens, metrics};
    });
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('GradeBench results changed');
    return rows;
  },
};
export default board;

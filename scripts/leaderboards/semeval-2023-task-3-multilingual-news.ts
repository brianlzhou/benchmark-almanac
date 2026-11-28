// The source reports no overall score. The headline is the plain mean of the 27 parts, computed by this importer.
// The organizers rank genre by macro F1 and framing and persuasion by micro F1 in each of nine languages.
// Appendix C of https://aclanthology.org/2023.semeval-1.317/ identifies the models used across all tasks.
import type { BoardPart, BoardStat, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://propaganda.math.unipd.it/semeval2023task3/SemEval2023testleaderboard.html';
const LANGUAGES = ['English', 'Italian', 'Russian', 'French', 'German', 'Polish', 'Spanish', 'Greek', 'Georgian'] as const;
const SUBTASKS: [number, string, string][] = [
  [1, 'F1 macro', 'F1 micro'],
  [2, 'F1 micro', 'F1 macro'],
  [3, 'F1 micro', 'F1 macro'],
];

const staticParts: Record<string, BoardPart> = Object.fromEntries(
  LANGUAGES.flatMap((lang) =>
    SUBTASKS.map(([n, official]) => [`${lang}: Subtask ${n}`, { name: `Subtask ${n} (${official})`, group: lang }]),
  ),
);

const staticStats: Record<string, BoardStat> = Object.fromEntries(
  LANGUAGES.flatMap((lang) =>
    SUBTASKS.map(([n, , secondary]) => [
      `${lang}: Subtask ${n} (${secondary})`,
      { name: `${lang} Subtask ${n} (${secondary})`, unit: 'score', better: 'higher' as const },
    ]),
  ),
);

const teams: Record<string, { model: string; models?: string[] }> = {
  QUST: { model: 'XLM-RoBERTa' },
  SinaaAI: { model: 'XLM, mBERT and LaBSE ensemble', models: ['XLM', 'mBERT', 'LaBSE'] },
};

const board: Leaderboard = {
  benchmark: 'semeval-2023-task-3-multilingual-news',
  url: feed,
  feed,
  terms: 'Official public SemEval standings at ' + feed,
  headline: 'The organizers report no overall score. This is the plain mean of the official F1 measures for 27 language and subtask pairs.',
  parts: staticParts,
  stats: staticStats,
  async fetch() {
    const html = await fetchText(feed);
    const configs = new Map<string, LeaderboardRow>();
    const seen = new Set<string>();
    for (const [, language, subtask, markup] of html.matchAll(/<h4>\s*(\w+) - Subtask ([123])\s*<\/h4>\s*(<table\b[\s\S]*?<\/table>)/gi)) {
      const [header, ...data] = tables(markup)[0];
      const official = subtask === '1' ? 'F1 macro' : 'F1 micro';
      if (header[1].text !== 'Team' || header[2].text !== official) throw new Error('Unrecognized results columns');
      const key = language + ': Subtask ' + subtask;
      if (seen.has(key)) throw new Error('Duplicate subtask table');
      seen.add(key);
      for (const cells of data) {
        const team = cells[1].text;
        if (!Object.hasOwn(teams, team)) continue;
        const row: LeaderboardRow = configs.get(team) ?? { ...teams[team], submitter: team, score: 0, metrics: {} };
        for (const i of [2, 3]) {
          if (!/^\d+\.\d+$/.test(cells[i].text)) throw new Error('Invalid F1 value');
          row.metrics![i === 2 ? key : key + ' (' + header[i].text + ')'] = Number(cells[i].text);
        }
        configs.set(team, row);
      }
    }
    const keys = [...seen];
    if (keys.length !== 27) throw new Error('Expected nine languages and three subtasks');
    const rows = [...configs.values()].filter(row => keys.every(k => k in row.metrics!));
    for (const row of rows) row.score = keys.reduce((sum, k) => sum + row.metrics![k], 0) / keys.length;
    return checked(rows, 2);
  },
};
export default board;

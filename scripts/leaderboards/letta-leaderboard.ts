// Letta's Context-Bench leaderboard measures agentic context engineering.
// The headline score is the Filesystem Rubric percentage. The importer also keeps matching Skill Rubric values.
// It reads the server-rendered model rows from Letta's public leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://docs.letta.com/leaderboard';
const TERMS = 'Public Letta leaderboard page. The page gives no blanket license for result reuse. Results are credited to Letta.';

function number(value: string): number {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n)) throw new Error(`Letta leaderboard: invalid score ${value}`);
  return n;
}

function readFilesystem(html: string): Map<string, LeaderboardRow> {
  const rows = new Map<string, LeaderboardRow>();
  for (const chunk of html.split('<div class="chart-row" data-model="').slice(1)) {
    const model = chunk.match(/^([^"]+)/)?.[1];
    if (!model) continue;
    const body = chunk;
    const score = body.match(/<span>([0-9.]+)%<\/span>/)?.[1];
    const cost = body.match(/<span class="cost-badge"[^>]*>\$([0-9.]+)<\/span>/)?.[1];
    if (!score) continue;
    rows.set(model, { model, score: number(score), ...(cost ? { cost: number(cost) } : {}) });
  }
  if (rows.size < 10) throw new Error(`Letta leaderboard: only ${rows.size} filesystem rows`);
  return rows;
}

function readSkills(html: string): Map<string, { task: number; skill: number }> {
  const rows = new Map<string, { task: number; skill: number }>();
  for (const chunk of html.split('<div class="multi-metric-row" data-model="').slice(1)) {
    const model = chunk.match(/^([^"]+)/)?.[1];
    if (!model) continue;
    const scores = [...chunk.matchAll(/<span>([0-9.]+)%<\/span>/g)].map((m) => number(m[1]));
    if (scores.length !== 2) throw new Error(`Letta leaderboard: ${model} has ${scores.length} skill scores`);
    rows.set(model, { task: scores[0], skill: scores[1] });
  }
  if (rows.size < 10) throw new Error(`Letta leaderboard: only ${rows.size} skill rows`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'letta-leaderboard',
  url: URL,
  feed: URL,
  terms: TERMS,
  parts: {
    filesystem: { name: 'Filesystem Rubric' },
    taskCompletion: { name: 'Task Completion Rubric' },
    skillUse: { name: 'Skill Use Rubric' },
  },
  fetch: async (): Promise<LeaderboardRow[]> => {
    const html = await fetchText(URL);
    const filesystem = readFilesystem(html);
    const skills = readSkills(html);
    for (const [model, scores] of skills) {
      const row = filesystem.get(model);
      if (row) row.metrics = { taskCompletion: scores.task, skillUse: scores.skill };
    }
    for (const row of filesystem.values()) row.metrics = { filesystem: row.score, ...(row.metrics ?? {}) };
    return [...filesystem.values()];
  },
};

export default board;

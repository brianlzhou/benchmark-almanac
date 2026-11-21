// BuilderBench evaluates language-model agents on 51 simulated cube-building tasks.
// The leaderboard's headline is mean final success rate across all listed tasks, expressed as a percentage.
// This importer reads the task index and each task JSON file published with the leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://rajghugare19.github.io/builderbench-leaderboard/';
const BASE = 'https://rajghugare19.github.io/builderbench-leaderboard/data/';
const pct = (v: number) => Math.round(v * 1000) / 10;

interface Entry {
  agent_name?: string;
  model_id?: string;
  website_url?: string;
  date?: string;
  mean_final_success_rate?: number;
  mean_final_progress?: number;
}

const board: Leaderboard = {
  benchmark: 'builderbench',
  url: PAGE,
  feed: `${BASE}tasks.json and one JSON file per task listed there`,
  terms: 'The leaderboard publishes JSON files from the MIT-licensed BuilderBench repository. Results are credited to the BuilderBench authors.',
  stats: { progress: { name: 'Mean final progress', unit: '%', better: 'higher' } },
  aliases: {
    'gpt-5.2-2025-12-11': 'gpt-5-2',
    'gemini-3-flash-preview': 'gemini-3-flash',
  },
  parts: {
    easy: { name: 'Easy tasks', group: 'Difficulty' },
    hard: { name: 'Hard tasks', group: 'Difficulty' },
  },
  async fetch() {
    const index = await fetchJson<{ tasks?: string[] }>(`${BASE}tasks.json`);
    if (!Array.isArray(index.tasks) || index.tasks.length < 5) throw new Error('BuilderBench: task index is missing or too short');
    const entries: (Entry & { task: string })[] = [];
    for (const task of index.tasks) {
      const data = await fetchJson<{ entries?: Entry[] }>(`${BASE}${encodeURIComponent(task)}.json`);
      if (!Array.isArray(data.entries) || data.entries.length === 0) throw new Error(`BuilderBench: ${task} has no entries`);
      for (const entry of data.entries) {
        if (!entry.model_id || !entry.agent_name || typeof entry.mean_final_success_rate !== 'number' || typeof entry.mean_final_progress !== 'number')
          throw new Error(`BuilderBench: ${task} has an entry with missing required columns`);
        entries.push({ ...entry, task });
      }
    }
    const groups = new Map<string, { all: Entry[]; easy: Entry[]; hard: Entry[] }>();
    for (const entry of entries) {
      const key = `${entry.model_id}\u0000${entry.agent_name}`;
      const g = groups.get(key) ?? { all: [], easy: [], hard: [] };
      g.all.push(entry);
      const cube = Number(entry.task.match(/^cube-(\d+)/)?.[1] ?? 0);
      (cube <= 5 ? g.easy : g.hard).push(entry);
      groups.set(key, g);
    }
    const rows: LeaderboardRow[] = [];
    for (const [key, g] of groups) {
      const [model, harness] = key.split('\u0000');
      if (g.all.length < index.tasks.length - 2) throw new Error(`BuilderBench: ${model} has only ${g.all.length} task rows`);
      const mean = (xs: Entry[]) => xs.reduce((sum, e) => sum + e.mean_final_success_rate!, 0) / xs.length;
      const progress = mean(g.all.map((e) => ({ ...e, mean_final_success_rate: e.mean_final_progress })));
      const metrics: Record<string, number> = { progress: pct(progress) };
      if (g.easy.length) metrics.easy = pct(mean(g.easy));
      if (g.hard.length) metrics.hard = pct(mean(g.hard));
      const dated = g.all.map((e) => e.date).filter((d): d is string => !!d).sort();
      rows.push({ model, harness, score: pct(mean(g.all)), date: dated.at(-1), metrics });
    }
    if (rows.length < 5) throw new Error(`BuilderBench: ${rows.length} models, expected at least 5`);
    return rows;
  },
};
export default board;

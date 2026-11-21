// AI AgriBench marks post-cutoff entries with two stars. The default table ranks them by mean accuracy across judge scores from its leaderboard API.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://aiagribench.org/api/leaderboard?variant=main";

const measures = ['accuracy', 'completeness', 'conciseness', 'relevance'] as const;
type Score = Record<typeof measures[number], number> & { evaluation_id: number; categories: string[] };
interface Evaluation { id: number; subject_model: string; created_at: string; link?: string }
interface Group { scores: Score[]; date: string; link?: string }
const mean = (values: number[]) => Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));

const board: Leaderboard = {
  benchmark: "ai-agribench-post-cutoff",
  url: "https://aiagribench.org/leaderboard",
  feed: FEED,
  aliases: { "deepseek-chat-v3-0324": "deepseek-v3-mar-2025" },
  terms: "The consortium requires explicit permission for commercial use. https://ansh-ankul.github.io/AI-Agribench-Blog-Post/#faq The robots.txt URL serves HTML.",
  stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, completeness: { name: 'Completeness', unit: '%', better: 'higher' }, conciseness: { name: 'Conciseness', unit: '%', better: 'higher' }, relevance: { name: 'Relevance', unit: '%', better: 'higher' } },
  async fetch() {
    const { evaluations, scores } = await fetchJson<{ evaluations: Evaluation[]; scores: Score[] }>(FEED);
    const runs = new Map(evaluations.filter((e) => e.subject_model.endsWith('**')).map((e) => [e.id, e]));
    const groups = new Map<string, Group>();
    for (const score of scores) {
      const run = runs.get(score.evaluation_id);
      if (!run || !score.categories.length) continue;
      if (!measures.every((key) => Number.isFinite(score[key]))) throw new Error('Missing judge score');
      const group = groups.get(run.subject_model) ?? { scores: [], date: '' };
      group.scores.push(score);
      if (run.created_at > group.date) Object.assign(group, { date: run.created_at, link: run.link || undefined });
      groups.set(run.subject_model, group);
    }
    if (groups.size < 7) throw new Error('Expected at least seven post-cutoff configurations');
    const parts: Record<string, string> = {};
    const rows = Array.from(groups, ([name, group]) => {
      const metrics = Object.fromEntries(measures.map((key) => [key, mean(group.scores.map((s) => s[key]))]));
      for (const category of new Set(group.scores.flatMap((s) => s.categories))) {
        parts[category] = category.replaceAll('_', ' ');
        metrics[category] = mean(group.scores.filter((s) => s.categories.includes(category)).map((s) => s.accuracy));
      }
      return { model: name.slice(0, -2), score: metrics.accuracy, metrics, date: group.date.slice(0, 10), link: group.link };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;

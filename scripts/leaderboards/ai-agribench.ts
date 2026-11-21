// AI AgriBench tests agronomy advice against expert answers. The default table ranks models by mean accuracy.
// The public API gives individual judgments. The page supplies the category filters and their display names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

const fields = ['accuracy', 'completeness', 'conciseness', 'relevance'] as const;
type Judgment = Record<typeof fields[number], number> & { evaluation_id: number; categories: string[] };
interface Evaluation { id: number; subject_model: string; created_at: string; link: string | null }
export const terms = 'The consortium requires explicit permission for commercial use. The site returns 404 for robots.txt. https://ansh-ankul.github.io/AI-Agribench-Blog-Post/#faq';

export async function agribenchRows(board: Leaderboard, minimum: number): Promise<LeaderboardRow[]> {
  const page = nextFlight(await fetchText(board.url));
  const categories = jsonAfter<{value: string; label: string}[]>(page, '"categoryOptions":');
  if (!categories.length) throw new Error('Missing AgriBench category filters');
  await new Promise(resolve => setTimeout(resolve, 1000));
  const { scores, evaluations } = await fetchJson<{ scores: Judgment[]; evaluations: Evaluation[] }>(board.feed);
  const byId = new Map(evaluations.map(e => [e.id, e]));
  const groups = new Map<string, Judgment[]>();
  const links = new Map<string, string>();
  const dates = new Map<string, string>();
  for (const j of scores) {
    const e = byId.get(j.evaluation_id);
    if (!e?.subject_model || !e.created_at || fields.some(k => !Number.isFinite(j[k]))) throw new Error('Invalid AgriBench judgment');
    if (!j.categories.some(k => categories.some(c => c.value === k))) continue;
    const group = groups.get(e.subject_model) ?? [];
    group.push(j);
    groups.set(e.subject_model, group);
    if (e.link) links.set(e.subject_model, e.link);
    if (e.created_at > (dates.get(e.subject_model) ?? '')) dates.set(e.subject_model, e.created_at);
  }
  const average = (group: Judgment[], key: typeof fields[number]) =>
    Number((group.reduce((s, j) => s + j[key], 0) / group.length).toFixed(2));
  board.parts = Object.fromEntries(categories.map(c => [c.value, c.label]));
  const rows: LeaderboardRow[] = [];
  for (const [model, group] of groups) {
    if (model.endsWith('**')) continue;
    const metrics = Object.fromEntries(fields.map(key => [key, average(group, key)]));
    for (const category of categories) {
      const subset = group.filter(j => j.categories.includes(category.value));
      if (subset.length) metrics[category.value] = average(subset, 'accuracy');
    }
    const subset = groups.get(model + '**');
    if (subset) {
      board.parts.postCutoff = 'Post-cutoff';
      metrics.postCutoff = average(subset, 'accuracy');
      for (const key of fields.slice(1)) metrics['postCutoff_' + key] = average(subset, key);
    }
    rows.push({ model, score: metrics.accuracy, metrics, link: links.get(model), date: dates.get(model)?.slice(0, 10) });
  }
  if (rows.length < minimum) throw new Error('Missing AgriBench models');
  return rows;
}

const board: Leaderboard = {
  benchmark: 'ai-agribench',
  url: 'https://aiagribench.org/leaderboard',
  feed: 'https://aiagribench.org/api/leaderboard?variant=main',
  terms,
  aliases: { 'deepseek-chat-v3-0324': 'deepseek-v3-mar-2025', 'mistral-large-2411': 'mistral-large-2-nov-2024' },
  fetch: () => agribenchRows(board, 25),
};
export default board;

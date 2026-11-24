// Read EvalPlus greedy pass@1, the prompt mode, model size, link, and published training-data flags.
import type { BoardStat, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

export const EVALPLUS_FEED = 'https://evalplus.github.io/results.json';

export const EVALPLUS_STATS: Record<string, BoardStat> = {
  activeParams: { name: 'Active parameters', unit: 'billions' },
  fullyOpenTrainingData: { name: 'Fully open training data', unit: 'count', note: '1 when EvalPlus marks the model training data as fully open, 0 otherwise.' },
  partiallyOpenTrainingData: { name: 'Partially open training data', unit: 'count', note: '1 when EvalPlus marks the model training data as partially open, 0 otherwise.' },
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** One row per model with pass@1 on `task`: "humaneval", "humaneval+", "mbpp" or "mbpp+". */
export async function evalplusRows(task: 'humaneval' | 'humaneval+' | 'mbpp' | 'mbpp+'): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Record<string, { 'pass@1'?: Record<string, number | null>; 'open-data'?: string; prompted?: boolean; size?: number | null; link?: string }>>(EVALPLUS_FEED);
  const rows: LeaderboardRow[] = [];
  for (const [name, e] of Object.entries(data)) {
    const score = e['pass@1']?.[task];
    if (typeof score !== 'number') continue;
    let model = name.replace(/^databricks\//, '').trim();
    // The linked c4ai-command-r-plus checkpoint is April 2024, not the registry's August snapshot.
    // Keep the historical label unlisted. The source gives no exact evaluation date.
    const historicalCommand = model === 'Command-R+';
    let date: string | undefined;
    const when = model.match(/\s*\((\w+)\.? (\d{4})\)$/);
    const month = when ? MONTHS.indexOf(when[1].slice(0, 3).toLowerCase()) : -1;
    if (when && month >= 0) {
      date = new Date(Date.UTC(Number(when[2]), month + 1, 0)).toISOString().slice(0, 10);
      model = model.slice(0, when.index).trim();
    }
    // These sizes describe active parameters rather than total parameters.
    const activeSize = /deepseek-(?:v[23]|coder-v2)|dbrx|mixtral/i.test(name);
    const size = typeof e.size === 'number' && Number.isFinite(e.size) && e.size > 0 ? e.size : undefined;
    const metrics: Record<string, number> = {};
    if (activeSize && size !== undefined) metrics.activeParams = size;
    if (e['open-data'] && ['Full', 'Partial', 'NONE'].includes(e['open-data'])) {
      metrics.fullyOpenTrainingData = Number(e['open-data'] === 'Full');
      metrics.partiallyOpenTrainingData = Number(e['open-data'] === 'Partial');
    }
    const link = typeof e.link === 'string' && /^https?:\/\/\S+$/.test(e.link.trim()) ? e.link.trim() : undefined;
    rows.push({ model: historicalCommand ? 'Command-R+ (April 2024)' : model, score, date,
      setting: typeof e.prompted === 'boolean' ? (e.prompted ? 'chat prompt' : 'code completion') : undefined,
      link,
      params: activeSize ? undefined : size,
      metrics });
  }
  if (!rows.length) throw new Error(`no ${task} scores in results.json`);
  return rows;
}

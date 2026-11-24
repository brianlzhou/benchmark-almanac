// EvalPlus evaluates code generation models on HumanEval, HumanEval+, MBPP and MBPP+ with greedy pass@1.
// On evalplus.github.io/leaderboard.html, the Average view computes average+ (mean of HumanEval+ and MBPP+,
// rounded to one decimal) for the EvalPlus Tests table and average (mean of HumanEval and MBPP) for the Base
// Tests table. This importer reads results.json, uses average+ as the headline score, and keeps all four
// component suites and the base average in parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { EVALPLUS_FEED } from '../lib/boards/evalplus.ts';
import { EVALPLUS_ALIASES, EVALPLUS_PAGE, EVALPLUS_TERMS } from './humaneval-plus.ts';
import { fetchJson } from '../lib/util.ts';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const calcAverage = (a?: number | null, b?: number | null) =>
  typeof a === 'number' && typeof b === 'number' ? Number(((a + b) / 2).toFixed(1)) : undefined;

const board: Leaderboard = {
  benchmark: 'evalplus',
  url: EVALPLUS_PAGE,
  feed: `${EVALPLUS_FEED} (pass@1 average+, humaneval+, mbpp+, humaneval, mbpp)`,
  terms: EVALPLUS_TERMS,
  aliases: EVALPLUS_ALIASES,
  parts: {
    humanevalPlus: { name: 'HumanEval+', group: 'EvalPlus tests' },
    mbppPlus: { name: 'MBPP+', group: 'EvalPlus tests' },
    humaneval: { name: 'HumanEval', group: 'Base tests' },
    mbpp: { name: 'MBPP', group: 'Base tests' },
    baseAverage: { name: 'Base average', group: 'Base tests' },
  },
  stats: {
    activeParams: { name: 'Active parameters', unit: 'billions' },
  },
  async fetch() {
    const data = await fetchJson<Record<string, { 'pass@1'?: Record<string, number | null>; 'open-data'?: string; prompted?: boolean; size?: number | null }>>(EVALPLUS_FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, e] of Object.entries(data)) {
      const p = e['pass@1'];
      const score = calcAverage(p?.['humaneval+'], p?.['mbpp+']);
      if (score === undefined) continue;
      let model = name.replace(/^databricks\//, '').trim();
      const historicalCommand = model === 'Command-R+';
      let date: string | undefined;
      const when = model.match(/\s*\((\w+)\.? (\d{4})\)$/);
      const month = when ? MONTHS.indexOf(when[1].slice(0, 3).toLowerCase()) : -1;
      if (when && month >= 0) {
        date = new Date(Date.UTC(Number(when[2]), month + 1, 0)).toISOString().slice(0, 10);
        model = model.slice(0, when.index).trim();
      }
      const activeSize = /deepseek-(?:v[23]|coder-v2)|dbrx|mixtral/i.test(name);
      const size = typeof e.size === 'number' && Number.isFinite(e.size) && e.size > 0 ? e.size : undefined;
      const metrics: Record<string, number> = {
        humanevalPlus: p!['humaneval+']!,
        mbppPlus: p!['mbpp+']!,
      };
      if (typeof p?.humaneval === 'number') metrics.humaneval = p.humaneval;
      if (typeof p?.mbpp === 'number') metrics.mbpp = p.mbpp;
      const baseAvg = calcAverage(p?.humaneval, p?.mbpp);
      if (baseAvg !== undefined) metrics.baseAverage = baseAvg;
      if (activeSize && size !== undefined) metrics.activeParams = size;
      rows.push({
        model: historicalCommand ? 'Command-R+ (April 2024)' : model,
        score,
        date,
        setting: typeof e.prompted === 'boolean' ? (e.prompted ? 'chat prompt' : 'code completion') : undefined,
        params: activeSize ? undefined : size,
        metrics,
      });
    }
    if (rows.length < 80) throw new Error(`Expected at least 80 EvalPlus rows, got ${rows.length}`);
    return rows;
  },
};
export default board;

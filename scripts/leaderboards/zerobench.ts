// ZeroBench. zerobench.github.io is a static page whose first table is the official leaderboard (models
// the ZeroBench team evaluated): pass@1, pass@5 and pass^5 on the 100 main questions, then mean cost and
// mean total tokens per question. The table's default sort is pass@5, so that is the score. The page
// publishes no data file (its chart data is embedded in the same HTML), so the importer reads the table.
// Tokens are total (input and output), not output tokens, so they are kept as metrics.totalTokens, not
// tokens; pass@1 and pass^5 are kept as metrics.passAt1 and metrics.pass5. The page's results plot draws
// pass@5 against total tokens per question on a log axis. The "externally reported" and "release" tables
// are retained when they publish main-question pass@5, with their provenance in setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://zerobench.github.io/';

const board: Leaderboard = {
  benchmark: 'zerobench',
  url: PAGE,
  feed: `${PAGE} (static HTML, official leaderboard table, pass@5)`,
  terms: 'Static GitHub Pages site that states no license or terms; the ZeroBench repository is MIT.',
  aliases: {
    'Claude 3.5 Sonnet v2': 'claude-3-5-sonnet-october-2024',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    // the only Gemini 2.0 Flash Thinking in the registry; plain "Gemini 2 Flash" stays unmatched because
    // the page does not say whether the December experimental or the February release was run
    'Gemini 2 Flash Thinking': 'gemini-2-0-flash-thinking-jan-2025',
    'Qwen2-VL-72B-Instruct': 'qwen2-vl-72b-instruct',
    'Pixtral-Large': 'pixtral-large',
  },
  chart: {
    title: 'Results plot: tokens per question',
    note: 'Official runs only: pass@5 on the 100 main questions against the mean total (input and output) tokens per question, with the Pareto frontier.',
    x: { key: 'totalTokens', label: 'Mean total tokens per question', unit: 'tokens', better: 'lower', log: true },
    y: { key: 'score', label: 'pass@5', unit: '%', better: 'higher' },
  },
  async fetch() {
    const [official, reported, release] = tables(await fetchText(PAGE));
    const head = official?.[1]?.map((c) => c.text.replace(/\s+$/, ''));
    if (!head || head[0] !== 'Model' || head[1] !== 'pass@1' || head[2] !== 'pass@5' || head[3] !== 'pass^5' || head[4] !== 'cost' || head[5] !== 'tokens') throw new Error(`unexpected ZeroBench header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of official.slice(2)) {
      const score = num(r[2]?.text);
      if (!r[0]?.text || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const pass1 = num(r[1]?.attrs['data-sort'] ?? r[1]?.text);
      const pass5 = num(r[3]?.text);
      const total = num(r[5]?.attrs['data-sort']);
      if (pass1 !== undefined) metrics.passAt1 = pass1;
      if (pass5 !== undefined) metrics.pass5 = pass5;
      if (total !== undefined) metrics.totalTokens = total;
      rows.push({ model: r[0].text, score, cost: num(r[4]?.attrs['data-sort']), metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    // The maker also publishes external reports and the original release evaluations. Never
    // substitute pass@1 or subquestion accuracy when a row lacks main-question pass@5.
    for (const r of reported?.slice(2) ?? []) {
      const score = num(r[2]?.text);
      if (!r[0]?.text || score === undefined) continue;
      if (/artificial\s*analysis|artificialanalysis\.ai/i.test(r[4]?.text + ' ' + r[4]?.html)) continue;
      const pass1 = num(r[1]?.text);
      const subquestions = num(r[3]?.text);
      const metrics: Record<string, number> = {};
      if (pass1 !== undefined) metrics.passAt1 = pass1;
      if (subquestions !== undefined) metrics.subquestionPassAt1 = subquestions;
      const qualifier = r[0].text.match(/\s*\(([^()]*(?:tools|reasoning|thinking|xhigh|max|high|medium|low)[^()]*)\)$/i);
      const model = qualifier ? r[0].text.slice(0, qualifier.index).trim() : r[0].text;
      rows.push({ model, score, setting: `${qualifier ? qualifier[1] + '; ' : ''}externally reported: ${r[4]?.text ?? 'source unspecified'}${r[5]?.text && r[5].text !== '—' ? `; ${r[5].text}` : ''}`, metrics });
    }
    for (const r of release?.slice(2) ?? []) {
      const score = num(r[2]?.text);
      if (!r[0]?.text || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [key, index] of [['passAt1', 1], ['pass5', 3], ['subquestionPassAt1', 4]] as const) {
        const value = num(r[index]?.text);
        if (value !== undefined) metrics[key] = value;
      }
      const total = num(r[7]?.attrs['data-sort']);
      if (total !== undefined) metrics.totalTokens = total;
      rows.push({ model: r[0].text, score, setting: 'original release evaluation', cost: num(r[6]?.attrs['data-sort'] ?? r[6]?.text), metrics });
    }
    return rows;
  },
};
export default board;

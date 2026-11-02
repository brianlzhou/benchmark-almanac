// BabyVision (UniPat AI). unipat.ai/benchmarks/BabyVision is server-rendered with the leaderboard as a
// static HTML table: Rank, Model, Type, Company, Release Date, Score (accuracy as a percentage) and a
// progress bar. Score is the score and the release date ("Aug 3, 2026") the row date. Names carry the run
// setup in parentheses: "(with tools)" or "(with Python tools)" becomes the harness and a reasoning effort
// such as "(xhigh)" the setting. The human baseline row is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://unipat.ai/benchmarks/BabyVision';
const EFFORTS = ['max', 'xhigh', 'high', 'medium', 'low', 'minimal'];

const board: Leaderboard = {
  benchmark: 'babyvision',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Gemini-3.0-Pro': 'gemini-3-pro',
    'Claude-4.5-Opus': 'claude-opus-4-5',
    // the registry's qwen3-vl-235b-a22b is the Thinking release (its card is Qwen3-VL-235B-A22B-Thinking)
    'Qwen3VL-235B-Thinking': 'qwen3-vl-235b-a22b',
    'InternVL3.5-241B': 'internvl3-5-241b-a28b',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Score') && rows[0]?.some((c) => c.text === 'Model'));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const col = (h: string) => head.indexOf(h);
    const [iModel, iType, iDate, iScore] = [col('Model'), col('Type'), col('Release Date'), col('Score')];
    if (iModel < 0 || iScore < 0) throw new Error(`unexpected columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      let model = r[iModel]?.text.trim() ?? '';
      const score = num(r[iScore]?.text);
      if (!model || score === undefined || /^human$/i.test(r[iType]?.text ?? '')) continue;
      let harness: string | undefined;
      let setting: string | undefined;
      for (const m of [...model.matchAll(/\s*\(([^)]*)\)/g)]) {
        const inner = m[1].trim();
        if (/^with\b/i.test(inner)) harness = inner.replace(/^with\s+/i, '');
        else if (EFFORTS.includes(inner.toLowerCase())) setting = inner.toLowerCase();
        else continue;
        model = model.replace(m[0], '');
      }
      const when = Date.parse(`${r[iDate]?.text ?? ''} UTC`);
      rows.push({ model: model.trim(), score, setting, harness, date: Number.isFinite(when) ? new Date(when).toISOString().slice(0, 10) : undefined });
    }
    return rows;
  },
};
export default board;

// SkillsBench v1.1 (87 tasks, 3 trials per task and mode). The official board export is
// leaderboard/skillsbench/v1.1/official.json in the benchflow/skillsbench-leaderboard Hugging Face dataset:
// per model and agent, with_skills_score and without_skills_score (100 × mean reward over reviewed
// non-timeout trials) and skill_lift. skillsbench.ai/leaderboard ranks by the With Skills column, so
// with_skills_score is the score. The agent (OpenHands, Codex, Claude Code, Gemini CLI) is the harness.
// Site-only with-skills runs supplement the paired export, preserving Hunyuan HY3.
// with_skills_ci, the half-width of the 95% interval the board shows on hover, gives metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables, num, text } from '../lib/html.ts';
import { fetchText, fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/benchflow/skillsbench-leaderboard/resolve/main/leaderboard/skillsbench/v1.1/official.json';

interface Row {
  model: string;
  agent?: string;
  version?: string;
  with_skills_score?: number;
  with_skills_ci?: number;
  coverage_status?: string;
  without_skills_score?: number;
  skill_lift?: number;
  normalized_gain?: number;
}

const AGENTS: Record<string, string> = {
  openhands: 'OpenHands',
  codex: 'Codex',
  'claude-code': 'Claude Code',
  'gemini-cli': 'Gemini CLI',
};

const board: Leaderboard = {
  benchmark: 'skillsbench',
  url: 'https://www.skillsbench.ai/leaderboard',
  feed: `${FEED} (with_skills_score)`,
  terms: 'Hugging Face dataset benchflow/skillsbench-leaderboard, licensed Apache-2.0.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<Row[]>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (typeof r.with_skills_score !== 'number' || (r.version && r.version !== 'v1.1')) continue;
      const ci = r.with_skills_ci;
      const metrics: Record<string, number> = typeof ci === 'number' ? { ciLow: r.with_skills_score - ci, ciHigh: r.with_skills_score + ci } : {};
      for (const key of ['without_skills_score', 'skill_lift', 'normalized_gain'] as const) if (typeof r[key] === 'number') metrics[key] = r[key];
      rows.push({
        model: r.model.trim(),
        score: r.with_skills_score,
        harness: r.agent ? (AGENTS[r.agent] ?? r.agent) : undefined,
        metrics,
      });
    }
    // The live site also publishes runs without a paired no-skills evaluation. Keep these
    // alongside the higher-precision export, without replacing any paired run.
    const table = tables(await fetchText('https://www.skillsbench.ai/leaderboard')).find(t => t[0]?.some(c => c.text === 'With Skills'));
    if (!table) throw new Error('SkillsBench site table missing');
    for (const r of table.slice(1)) {
      if (num(r[2]?.text) !== undefined) continue;
      const spans = [...(r[1]?.html ?? '').matchAll(/<span\b[^>]*>([^<]+)<\/span>/g)].map(m => text(m[1]));
      const [model, harness] = spans;
      const score = num(r[3]?.text);
      if (model && score !== undefined && !rows.some(v => v.model === model && v.harness === harness)) rows.push({model, harness, score});
    }
    return rows;
  },
};
export default board;

// NYT Connections, extended version (Lech Mazur). The board is the markdown table under "Leaderboard: Extended
// Version" in the lechmazur/nyt-connections README: models that completed all 940 puzzles, ranked by Score %
// (0 to 100), which is the score. The newest 100 puzzles form a part. Comparison tables supply run statistics. Names carry the reasoning effort in parentheses ("GPT-6 Astra (max reasoning)"), which the
// resolver splits off as the setting. Two other spellings of a setting are split here: Anthropic's thinking
// budget ("Claude Opus 4.6 Thinking 16K") and xAI's mode, bare or in parentheses ("Grok 4.1 Fast
// Non-Reasoning", "Grok 4.20 0309 (Reasoning)"). Beta and experimental snapshots
// the registry does not hold ("Grok 4.20 Reasoning Exp Beta 0304", "Qwen3 Max (2026-01-23)") stay unmatched.
// Other importers for Lech Mazur's boards use lechMazurTable and lechMazurName.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdRecords, mdTables } from './big-bench-extra-hard.ts';

export const LECH_MAZUR_TERMS = (repo: string) =>
  `README table in the lechmazur/${repo} GitHub repository, which states no license; scores are cited to Lech Mazur.`;

/** The records of the first README table under a heading that matches `heading`, in a lechmazur repository. */
export async function lechMazurTable(repo: string, branch: string, heading: RegExp): Promise<Record<string, string>[]> {
  const t = mdTables(await fetchText(ghRaw(`lechmazur/${repo}`, 'README.md', branch))).find((x) => heading.test(x.heading));
  if (!t) throw new Error(`no table under ${heading} in lechmazur/${repo}`);
  return mdRecords(t);
}

/**
 * A Lech Mazur board name split into the model, the setting and a snapshot date: a Claude thinking budget
 * ("Claude Sonnet 4 Thinking 16K"), "(no reasoning)", an xAI mode, a DeepSeek API mode, or a trailing date
 * stamp ("GPT-4o 2024-08-06").
 */
export function lechMazurName(name: string): { model: string; setting?: string; date?: string } {
  const stamp = name.match(/^(.+?) (20\d\d-\d\d-\d\d)$/);
  if (stamp) return { model: name, date: stamp[2] };
  const budget = name.match(/^(Claude .+?) Thinking (\d+K)$/);
  if (budget) return { model: budget[1], setting: `thinking ${budget[2]}` };
  const none = name.match(/^(.+?) \(no reasoning\)$/);
  if (none) return { model: none[1], setting: 'no reasoning' };
  const mode = name.match(/^(.+?) \(?(Non-Reasoning|Reasoning)\)?$/);
  if (mode && /^Grok/i.test(mode[1])) return { model: mode[1], setting: mode[2].toLowerCase() };
  // "DeepSeek V3.1 Reasoner" and "DeepSeek V3.1 Non-Think": DeepSeek's two API modes
  const ds = name.match(/^(DeepSeek .+?) (Reasoner|Non-Think)$/);
  if (ds) return { model: ds[1], setting: ds[2] === 'Reasoner' ? 'thinking' : 'non-thinking' };
  return { model: name };
}

/** Lech Mazur's spellings that the shared resolver cannot place, shared by his boards. */
export const LECH_MAZUR_ALIASES: Record<string, string> = {
  'Claude 4.5 Haiku': 'claude-haiku-4-5',
  'Muse Wonder 1.0': 'muse-wonder',
  'Grok 4.20 0309': 'grok-4-20',
  'Xiaomi MiMo V2.5 Pro': 'mimo-v2-5-pro',
  'Xiaomi MiMo V2 Pro': 'mimo-v2-pro',
  'ByteDance Seed2.0 Pro': 'seed-2-0-pro',
  'Baidu Ernie 5.1': 'ernie-5-1',
  'Baidu Ernie 5.0': 'ernie-5-0',
  'Arcee Trinity Large Thinking': 'trinity-large-thinking',
  'Baidu Ernie 4.5 300B A47B': 'ernie-4-5-300b-a47b',
  'Gemini 2.0 Flash Think Exp 01-21': 'gemini-2-0-flash-thinking-jan-2025',
  'Gemini 1.5 Pro (Sept)': 'gemini-1-5-pro-sept-2024',
  'Grok 2 12-12': 'grok-2-dec-2024',
  'Microsoft Phi-4': 'phi-4',
  'Qwen QwQ-32B 16K': 'qwq-32b',
  'Qwen QwQ Preview': 'qwq-32b-preview',
  'Qwen 3 235B A22B 25-07 Think': 'qwen3-235b-a22b-thinking-jul-2025',
  'Qwen 3 235B A22B 25-07 Instruct': 'qwen3-235b-a22b-instruct-jul-2025',
  // these boards list later snapshots under their own names ("DeepSeek R1 05/28", "DeepSeek V3-0324",
  // "Gemini 2.5 Pro Exp 03-25"), so the plain names are the first releases or the stable ones
  'DeepSeek R1': 'deepseek-r1',
  'DeepSeek-V3': 'deepseek-v3',
  'Kimi K2': 'kimi-k2-jul-2025',
  'Kimi K2 Thinking 64K': 'kimi-k2-thinking',
  'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
  'Gemini 2.0 Flash Exp': 'gemini-2-0-flash-dec-2024',
  'Gemini 2.5 Pro Preview 05-06': 'gemini-2-5-pro-may-2025',
  'Gemini 2.5 Pro Exp 03-25': 'gemini-2-5-pro-mar-2025',
  'Claude 3.5 Sonnet 2024-10-22': 'claude-3-5-sonnet-october-2024',
};

const REPO = 'nyt-connections';

const board: Leaderboard = {
  benchmark: 'nyt-connections-extended',
  parts: { newest100: { name: 'Newest 100 puzzles', group: 'Puzzle date' } },
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md', 'master')} (Leaderboard: Extended Version, Score %)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  stats: {
    fullySolved: { name: 'Fully solved puzzles', unit: 'count', better: 'higher' },
    newest100Solved: { name: 'Newest 100 puzzles solved', unit: 'count', better: 'higher' },
    estimatedTotalCost: { name: 'Estimated total cost', unit: 'usd', better: 'lower' },
  },
  chart: {
    title: 'Cost vs. performance',
    note: 'Estimated average cost per puzzle at standard list prices against full extended score, matching the cost versus performance chart in the repository.',
    x: { key: 'cost', label: 'Estimated cost per puzzle', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    const md = await fetchText(ghRaw('lechmazur/' + REPO, 'README.md', 'master'));
    const tables = mdTables(md);
    const full = tables.find(t => t.heading === 'Leaderboard: Extended Version');
    if (!full) throw new Error('Extended Version table missing');
    const newest = tables.find(t => t.heading.startsWith('Leaderboard: Newest 100'));
    const recent = new Map((newest ? mdRecords(newest) : []).map(r => [r.Model, Number(r['Score %'])]));
    const byName = new Map<string, LeaderboardRow>();
    for (const r of mdRecords(full)) {
      const score = Number(r['Score %']);
      if (!r.Model || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      const subset = recent.get(r.Model);
      if (subset != null && Number.isFinite(subset)) metrics.newest100 = subset;
      const row = { ...lechMazurName(r.Model), score, metrics };
      rows.push(row);
      byName.set(r.Model, row);
    }
    const high = tables.find(t => t.head.includes('Standard-price cost/puzzle'));
    for (const r of high ? mdRecords(high) : []) {
      const row = byName.get(r['Model (high reasoning)'] + ' (high reasoning)');
      if (!row) continue;
      const price = r['Standard-price cost/puzzle'].match(/^\$([\d.]+)$/);
      if (price) row.cost = Number(price[1]);
      if (/^\d+$/.test(r['Fully solved'])) row.metrics!.fullySolved = Number(r['Fully solved']);
    }
    for (const t of tables.filter(t => t.head[0] === 'Metric')) {
      for (const [col, name] of t.head.entries()) {
        const row = byName.get(name) ?? byName.get('ByteDance ' + name);
        if (!row) continue;
        for (const cells of t.rows) {
          const cell = cells[col]?.replace(/[$,]/g, '');
          if (!cell || !Number.isFinite(Number(cell))) continue;
          if (/^Estimated cost per/.test(cells[0])) row.cost = Number(cell);
          if (cells[0] === 'Mean output tokens per priced response') row.tokens = Number(cell);
          if (cells[0] === 'Fully solved, all 940 puzzles') row.metrics!.fullySolved = Number(cell);
          if (cells[0] === 'Fully solved, newest 100 puzzles') row.metrics!.newest100Solved = Number(cell);
          if (cells[0] === 'Estimated total cost') row.metrics!.estimatedTotalCost = Number(cell);
        }
      }
    }
    const gemini = md.match(/Neon's estimated cost per response is ([\d.]+)¢,[\s\S]{0,80}?Carbon's ([\d.]+)¢/);
    if (gemini) {
      for (const [name, cents] of [['Neon', gemini[1]], ['Carbon', gemini[2]]]) {
        const row = byName.get('Gemini 4 ' + name + ' (high reasoning)');
        if (row) row.cost = Number(cents) / 100;
      }
    }
    return rows;
  },
};
export default board;

// NYT Connections, extended version (Lech Mazur). The board is the markdown table under "Leaderboard: Extended
// Version" in the lechmazur/nyt-connections README: models that completed all 940 puzzles, ranked by Score %
// (0 to 100), which is the score. The "Newest 100 puzzles" and "Older models" tables are other views and are
// not read. Names carry the reasoning effort in parentheses ("GPT-6 Astra (max reasoning)"), which the
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
  url: `https://github.com/lechmazur/${REPO}`,
  feed: `${ghRaw(`lechmazur/${REPO}`, 'README.md', 'master')} (Leaderboard: Extended Version, Score %)`,
  terms: LECH_MAZUR_TERMS(REPO),
  aliases: LECH_MAZUR_ALIASES,
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of await lechMazurTable(REPO, 'master', /^Leaderboard: Extended Version$/)) {
      const score = Number(r['Score %']);
      if (r.Model && Number.isFinite(score)) rows.push({ ...lechMazurName(r.Model), score });
    }
    return rows;
  },
};
export default board;

// Aider's code editing leaderboard (the 133 Python Exercism exercises, retired for the polyglot board in
// December 2024): a YAML list in the aider repository, one entry per run, with pass_rate_2 (share of
// exercises passing after one retry with test output, 0 to 100) as the score, the edit format as the
// harness and the run date. The page's table shows only the pass rate and the well-formed share, but each YAML
// entry also gives total_cost (US dollars for the run; 0 when unknown) and seconds_per_case. Cost per task is
// total_cost over test_cases, and seconds_per_case is kept as metrics.latency.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/edit_leaderboard.yml';

/** The file is a flat list of "- key: value" maps, so a line parser is enough. */
function parse(yaml: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  let cur: Record<string, string> | null = null;
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(- |  )(\w+):\s*(.*)$/);
    if (!m) continue;
    if (m[1] === '- ') out.push((cur = {}));
    if (cur) cur[m[2]] = m[3].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'aider-edit',
  url: 'https://aider.chat/docs/leaderboards/edit.html',
  feed: FEED,
  terms: 'Apache-2.0 repository file on GitHub.',
  aliases: {},
  async fetch() {
    return parse(await fetchText(FEED))
      // Keep older snapshots under explicit names instead of dropping them or matching newer releases.
      .filter((r) => r.model && Number.isFinite(Number(r.pass_rate_2)))
      .map((r) => ({
        model: r.model === 'command-r-plus' ? 'Command R+ (April 2024)' : r.model === 'ollama/codestral' ? 'Codestral 22B (May 2024)' : r.model,
        score: Number(r.pass_rate_2),
        harness: r.edit_format ? `aider, ${r.edit_format} edits` : 'aider',
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date : undefined,
        cost: Number(r.total_cost) > 0 && Number(r.test_cases) > 0 ? Number(r.total_cost) / Number(r.test_cases) : undefined,
        metrics: Number(r.seconds_per_case) > 0 ? { latency: Number(r.seconds_per_case) } : undefined,
      }));
  },
};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^gemini15(?:pro|flash|flash8b)exp(?:0827|0924)$/.test(name)) return {...r, model: `${r.model} (snapshot not in registry)`};
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
board.aliases = {...board.aliases, ...{"claude-3-5-sonnet-20241022": "claude-3-5-sonnet-october-2024"}};
export default board;

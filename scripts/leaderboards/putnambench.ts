// PutnamBench: the default Lean-with-answer board, with solved counts and reported
// compute budgets. Percentages follow the live board denominators, not inferred historical set sizes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const PAGE = 'https://trishullab.github.io/PutnamBench/leaderboard.html';
const FEED = 'https://trishullab.github.io/PutnamBench/results.json';

interface Entry {
  link?: string;
  'condensed-compute-budget'?: string;
  'date-added'?: string;
  'num-solved'?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'putnambench',
  url: PAGE,
  feed: `${FEED} (default Lean-with-answer solved percentage)`,
  terms: 'Static JSON on the PutnamBench GitHub Pages site (robots.txt allows all); the PutnamBench repository releases its problems under Apache 2.0 (Lean, Isabelle) and MIT (Rocq).',
  aliases: {
    'gemini-2.5-pro-exp-0325': 'gemini-2-5-pro-mar-2025',
    'gemini-2.0-flash-thinking-121': 'gemini-2-0-flash-thinking-jan-2025',
    // the entry's size is 671 (billion parameters)
    'DeepSeek-Prover-V2': 'deepseek-prover-v2-671b',
    'Seed-Prover (ByteDance)': 'seed-prover',
    'Seed-Prover 1.5 (ByteDance)': 'seed-prover-1-5',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const size = Number(html.match(/Lean with answer[^<]*\(out of (\d+)\)/)?.[1]);
    if (!size) throw new Error('Lean set size not found on the PutnamBench page');
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [name, e] of Object.entries(data)) {
      for (const [split, solved] of Object.entries(e['num-solved'] ?? {})) {
        if (split !== 'lean-wsolution' || typeof solved !== 'number') continue;
        const label = split === 'lean-wsolution' ? 'Lean with answer' : split === 'lean-nosolution' ? 'Lean no answer' : split === 'isabelle-wsolution' ? 'Isabelle' : split === 'coq-wsolution' ? 'Rocq' : null;
        if (!label) throw new Error(`Unknown PutnamBench split: ${split}`);
        const denominator = Number(html.match(new RegExp(label + '[^<]*\\(out of (\\d+)\\)'))?.[1]);
        if (!denominator) throw new Error(`Missing denominator for ${split}`);
        const budget = e['condensed-compute-budget'];
        rows.push({
          model: /InternLM-Math/i.test(e.link ?? '') ? 'InternLM-Math 7B' : name.trim(),
          score: Number(((100 * solved) / denominator).toFixed(2)),
          setting: budget,
          date: /^\d{4}-\d\d-\d\d$/.test(e['date-added'] ?? '') ? e['date-added'] : undefined,
          cost: (() => { const m = budget?.match(/(?:avg\.?|average|mean)\s*\$([\d,.]+)/i) ?? budget?.match(/^\$([\d,.]+)\/task$/); return m ? Number(m[1].replace(/,/g, '')) : undefined; })(),
          metrics: {solved, denominator},
        });
      }
    }
    return rows;
  },
};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;

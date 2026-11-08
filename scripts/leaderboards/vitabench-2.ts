// VitaBench 2.0 on vitabench2.github.io. The leaderboard is static HTML in two tables, thinking models and
// non-thinking models, each with a two-row header: # | Model | Full Context | Agentic Memory | RAG Memory,
// then Avg@4 | Pass@4 | Pass^4 under each memory setting. The page sorts by Avg@4 with full context (a
// fraction, shown here as 0 to 100), which is the score. The table a row comes from becomes the setting.
// Full context Pass@4 and Pass^4 are kept as metrics.pass4 and metrics.passHat4 (0 to 100).
// Agentic Memory and RAG Memory are separate harness rows with the same published metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://vitabench2.github.io/';

const board: Leaderboard = {
  benchmark: 'vitabench-2',
  url: URL,
  feed: `${URL} (thinking and non-thinking tables, all memory settings Avg@4)`,
  terms: 'Static GitHub Pages project page with no robots.txt and no terms; the scores are cited to the VitaBench authors.',
  aliases: {
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
  },
  async fetch() {
    const boards = tables(await fetchText(URL)).filter((t) => t[0]?.[2]?.text === 'Full Context' && /^Avg@4$/.test(t[1]?.[0]?.text ?? ''));
    if (boards.length !== 2) throw new Error(`expected two VitaBench 2.0 tables, found ${boards.length}`);
    const rows: LeaderboardRow[] = [];
    boards.forEach((t, k) => {
      for (const r of t.slice(2)) {
        for (const [offset, harness] of [[2, undefined], [5, "Agentic Memory"], [8, "RAG Memory"]] as const) {
        const score = num(r[offset]?.text);
        if (!r[1]?.text || score === undefined) continue;
        // the second header row starts at Avg@4, so the full-context Pass@4 and Pass^4 cells follow the score
        const pass4 = t[1]?.[1]?.text === 'Pass@4' ? num(r[offset+1]?.text) : undefined;
        const passHat4 = t[1]?.[2]?.text === 'Pass^4' ? num(r[offset+2]?.text) : undefined;
        const metrics = { ...(pass4 === undefined ? {} : { pass4: pass4 * 100 }), ...(passHat4 === undefined ? {} : { passHat4: passHat4 * 100 }) };
        rows.push({ model: r[1].text, score: score * 100, harness, setting: k === 0 ? 'thinking' : 'non-thinking', ...(Object.keys(metrics).length ? { metrics } : {}) });
        }
      }
    });
    if (!rows.length) throw new Error('no rows in the VitaBench 2.0 tables');
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

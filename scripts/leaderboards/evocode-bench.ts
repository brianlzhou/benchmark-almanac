// EvoCode-Bench, first release (UniPat AI). unipat.ai/benchmarks/EvoCode-Bench is server-rendered. Below
// the current v2 board it keeps the paper evaluation as a table marked "Legacy · MT@4" (the legacy
// harbor_multiturn runner with the terminus-2 scaffold, best of four attempts per multi-round task): per agent the model name, organization and reasoning setting, MT@4 (the ranking, 0 to
// 100), single-round pass rate, completion, turns and output tokens. MT@4 is the score, the headline of the
// paper and of this table. "high reasoning effort" becomes the setting high and "thinking enabled" the
// setting thinking. The same table was published in the Terminal-X post on 2026-05-02, which is the row
// date. The v2 re-release board on the same page is read by evocode-bench-v2.ts from the GitHub README.
// Avg Turns (agent turns per task, across its rounds) is kept as metrics.turns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://unipat.ai/benchmarks/EvoCode-Bench';
const DATE = '2026-05-02';

const board: Leaderboard = {
  benchmark: 'evocode-bench',
  url: URL,
  feed: `${URL} (original MT@4 table)`,
  terms: 'Server-rendered page on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Doubao-Seed-2.0-Pro': 'seed-2-0-pro',
    'Xiaomi-MiMo-V2.5-Pro': 'mimo-v2-5-pro',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'MT@4') && rows[0]?.some((c) => c.text === 'Agent'));
    if (!t) throw new Error('EvoCode-Bench MT@4 table not found');
    const head = t[0].map((c) => c.text);
    const [iAgent, iScore, iTok, iTurns] = [head.indexOf('Agent'), head.indexOf('MT@4'), head.indexOf('Output Tok.'), head.findIndex((h) => /^Avg\.? Turns/.test(h))];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iAgent]?.html ?? '';
      const name = text(cell.match(/class="evb-model-name">([\s\S]*?)<\/div>/)?.[1] ?? '');
      const how = text(cell.match(/class="evb-model-setting">([\s\S]*?)<\/div>/)?.[1] ?? '').toLowerCase();
      const score = num(r[iScore]?.text);
      if (!name || score === undefined) continue;
      const effort = how.match(/^(max|xhigh|high|medium|low)\b.*effort/)?.[1];
      const setting = effort ?? (/thinking enabled/.test(how) ? 'thinking' : undefined);
      const tok = iTok >= 0 ? r[iTok]?.text.match(/([\d.]+)\s*K/i) : null;
      const turns = iTurns >= 0 ? num(r[iTurns]?.text) : undefined;
      rows.push({
        // "Claude-Opus-4.7-High": the effort is already in the setting
        model: effort ? name.replace(new RegExp(`-${effort}$`, 'i'), '') : name,
        score,
        setting,
        harness: 'terminus-2',
        date: DATE,
        tokens: tok ? Number(tok[1]) * 1000 : undefined,
        metrics: turns !== undefined ? { turns } : undefined,
      });
    }
    return rows;
  },
};
export default board;

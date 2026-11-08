// SWE-Refactor-Bench on lab.einsia.ai. The leaderboard page is static HTML with two ranking tables, one for
// proprietary models swept over reasoning effort and one for open-weight models at a single configuration,
// both with # | Model | Client | Cfg | Runs | Gate | Ceil. | Blind | Adm. | Broken | Acc. | Score. Score (0 to
// 100, the page's ranking) is the headline and the client (Claude Code, Codex CLI) the harness. A per-task
// grid above them is not read. Configuration bars add effort, cost per task, and outcome counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://lab.einsia.ai/swe-refactor-bench/leaderboard/';

const board: Leaderboard = {
  benchmark: 'swe-refactor-bench',
  url: URL,
  feed: `${URL} (ranking tables, Score)`,
  terms: 'Static public page; robots.txt allows all paths and the site publishes no terms.',
  aliases: {
    'dsv4-flash': 'deepseek-v4-flash',
  },
  async fetch() {
    const source = await fetchText(URL);
    const boards = tables(source).filter((t) => {
      const head = t[0]?.map((c) => c.text) ?? [];
      return head[1] === 'Model' && head[2] === 'Client' && head.at(-1) === 'Score';
    });
    if (!boards.length) throw new Error('no SWE-Refactor-Bench ranking table');
    const rows: LeaderboardRow[] = [];
    for (const t of boards) {
      for (const r of t.slice(1)) {
        const score = num(r.at(-1)?.text);
        if (!r[1]?.text || score === undefined || r.length !== t[0].length) continue;
        rows.push({ model: r[1].text, score, harness: r[2]?.text || undefined });
      }
    }
    for(const m of source.matchAll(/title="([^"·]+) · ([^"—]+) — score ([\d.]+), (\d+) accepted \/ (\d+) broken \/ (\d+) blind of (\d+) runs, \$([\d.]+) per task"/g)) {
      const base=rows.find(r=>r.model===m[1]);if(!base)throw new Error(`Unknown configuration model ${m[1]}`);
      rows.push({model:m[1],score:Number(m[3]),setting:m[2],harness:base.harness,cost:Number(m[8]),metrics:{accepted:Number(m[4]),broken:Number(m[5]),blind:Number(m[6]),runs:Number(m[7])}});
    }
    return rows;
  },
};
export default board;

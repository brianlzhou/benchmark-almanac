// Harbor-Index. The frozen Harbor Hub leaderboards for releases 1.0 to 1.4 show no rows, so the only
// published results are the launch post's chart (tbench.ai/news/harbor-index, "Pass rate vs. cost per run"):
// one point per agent-model pair on Harbor-Index 1.0 (82 tasks), with pass rate, the cost of one full run
// and the harness. The chart is a client component whose points are a literal array in one of the page's
// Next.js chunks; this file finds the chunk that defines HarborIndexParetoChart and reads label, cost, score
// and harness from that array. The score is the pass rate (percent). The label's parenthesis is the
// harness (Codex CLI, Claude Code, Gemini CLI, Terminus 2). Cost per task is the run cost over 82 tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.tbench.ai/news/harbor-index';
const ORIGIN = 'https://www.tbench.ai';
const TASKS = 82;

const board: Leaderboard = {
  benchmark: 'harbor-index',
  url: PAGE,
  feed: `${PAGE} (chart points in the Next.js chunk that defines HarborIndexParetoChart)`,
  terms: 'Public launch post on tbench.ai, which serves no robots.txt and states no terms for its posts; the Terminal-Bench repository is Apache-2.0.',
  async fetch() {
    const html = await fetchText(PAGE);
    const chunks = [...new Set([...html.matchAll(/\/_next\/static\/chunks\/[\w.-]+\.js/g)].map((m) => m[0]))];
    let js = '';
    for (const c of chunks) {
      const s = await fetchText(ORIGIN + c);
      if (s.includes('HarborIndexParetoChart') && s.includes('[{label:"')) {
        js = s;
        break;
      }
    }
    if (!js) throw new Error('Harbor-Index chart chunk not found');
    const start = js.lastIndexOf('[{label:"', js.indexOf('HarborIndexParetoChart'));
    const block = js.slice(start, js.indexOf('}]', start) + 2);
    const rows: LeaderboardRow[] = [];
    for (const e of block.matchAll(/\{label:"([^"]+)",[^{}]*?cost:([\d.]+),score:([\d.]+)/g)) {
      const m = e[1].match(/^(.*?)\s*\(([^)]+)\)$/);
      if (!m) continue;
      rows.push({ model: m[1], harness: m[2], score: Number(e[3]), cost: Number(e[2]) / TASKS });
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} Harbor-Index points`);
    return rows;
  },
};
export default board;

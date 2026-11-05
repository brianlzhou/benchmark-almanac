// VITA-Bench (Meituan LongCat). vitabench.github.io is a static page whose leaderboard is one HTML table:
// Rank | Models, then Avg@4, Pass@4 and Pass^4 for Cross-Scenarios, Delivery, In-store and OTA, with
// section rows "Thinking Models" and "Non-thinking Models". The headline is Cross-Scenarios Avg@4 (the
// figure LongCat's own model cards cite). A model listed in both sections gets the section as its setting
// unless its name already gives an effort level, such as "(high)". Cross-Scenarios Pass@4 (`passAt4`) and
// Pass^4 (`pass4`), the next two columns, are kept as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://vitabench.github.io/';

const board: Leaderboard = {
  benchmark: 'vita-bench',
  url: `${URL}#Leaderboard`,
  feed: `${URL} (static HTML table, Cross-Scenarios Avg@4)`,
  terms: 'Static GitHub Pages site; the VitaBench repository (meituan-longcat/vitabench) is MIT-licensed and the page states no other terms.',
  aliases: {
    'Claude-4.5-Opus': 'claude-opus-4-5',
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    // ByteDance's Seed1.8 (the registry lists Seed 2.0 as Doubao-Seed-2.0)
    'Doubao-Seed-1.8': 'seed-1-8',
    'Doubao-Seed-1.8-Thinking': 'seed-1-8',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Kimi-K2-0905': 'kimi-k2-sep-2025',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /cross-scenarios/i.test(c.text)));
    if (!t) throw new Error('VITA-Bench table not found');
    // the second header row names the Cross-Scenarios columns read below
    if (!/^Avg/.test(t[1]?.[0]?.text ?? '') || !/^Pass @4/.test(t[1]?.[1]?.text ?? '') || !/^Pass \^4/.test(t[1]?.[2]?.text ?? '')) {
      throw new Error(`unexpected VITA-Bench columns: ${t[1]?.map((c) => c.text).join(' | ')}`);
    }
    const rows: LeaderboardRow[] = [];
    let section: string | undefined;
    for (const r of t.slice(2)) {
      if (r.length === 1) {
        section = /non-thinking/i.test(r[0].text) ? 'non-thinking' : /thinking/i.test(r[0].text) ? 'thinking' : undefined;
        continue;
      }
      const model = r[1]?.text;
      const score = num(r[2]?.text);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const passAt4 = num(r[3]?.text);
      const pass4 = num(r[4]?.text);
      if (passAt4 !== undefined) metrics.passAt4 = passAt4;
      if (pass4 !== undefined) metrics.pass4 = pass4;
      const effort = model.match(/\s*\((high|low|medium|xhigh|none|max)\)$/i);
      rows.push({
        model: effort ? model.slice(0, effort.index).trim() : model,
        score,
        setting: effort ? effort[1].toLowerCase() : section,
        metrics,
      });
    }
    return rows;
  },
};
export default board;

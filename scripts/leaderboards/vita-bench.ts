// VITA-Bench (Meituan LongCat). vitabench.github.io is a static page whose leaderboard is one HTML table:
// Rank | Models, then Avg@4, Pass@4 and Pass^4 for Cross-Scenarios, Delivery, In-store and OTA, with
// section rows "Thinking Models" and "Non-thinking Models". The headline is Cross-Scenarios Avg@4 (the
// figure LongCat's own model cards cite). A model listed in both sections gets the section as its setting
// unless its name already gives an effort level, such as "(high)".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://vitabench.github.io/';

const board: Leaderboard = {
  benchmark: 'vita-bench',
  url: `${URL}#Leaderboard`,
  feed: `${URL} (static HTML table, Cross-Scenarios Avg@4)`,
  terms: 'Static GitHub Pages site; the VitaBench repository (meituan-longcat/vitabench) is MIT-licensed and the page states no other terms.',
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /cross-scenarios/i.test(c.text)));
    if (!t) throw new Error('VITA-Bench table not found');
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
      const effort = model.match(/\s*\((high|low|medium|xhigh|none|max)\)$/i);
      rows.push({
        model: effort ? model.slice(0, effort.index).trim() : model,
        score,
        setting: effort ? effort[1].toLowerCase() : section,
      });
    }
    return rows;
  },
};
export default board;

// IMO-ProofBench (Google DeepMind, IMO-Bench). imobench.github.io is a static page. Its "Latest
// Leaderboard" table lists frontier models and systems on the advanced ProofBench set: the advanced score
// (share of the 210 available points from the ProofAutoGrader, 0 to 100), a breakdown by problem source
// and the query date. The advanced score is the score and the query date the row date. The older
// "Leaderboard September, 2025" table is retained as historical runs with query dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://imobench.github.io/';

const board: Leaderboard = {
  benchmark: 'imo-proofbench',
  url: `${URL}#leaderboard`,
  feed: `${URL} (static HTML table "Latest Leaderboard", Advanced ProofBench)`,
  terms: 'Static GitHub Pages site; the IMO-Bench data in google-deepmind/superhuman is CC BY 4.0 and the page states no other terms.',
  aliases: {},
  async fetch() {
    // the first table headed "Advanced ProofBench" is the latest board
    const ts = tables(await fetchText(URL)).filter((rows) => rows[0]?.some((c) => c.text === 'Advanced ProofBench'));
    if (!ts.length) throw new Error('IMO-ProofBench table not found');
    const rows: LeaderboardRow[] = [];
    const seen = new Set<string>();
    for (const t of ts) for (const r of t.slice(2)) {
      const model = r[0]?.text;
      const score = num(r[1]?.text);
      const date = r.at(-1)?.text;
      if (!model || score === undefined) continue;
      const key = JSON.stringify([model, score, date]);
      if (seen.has(key)) continue;
      seen.add(key);
      // "GPT-5.5 Pro (xhigh)": the effort becomes the setting
      const effort = model.match(/\s*\((low|medium|high|xhigh|max)\)$/i);
      rows.push({
        model: effort ? model.slice(0, effort.index).trim() : model,
        score,
        metrics: Object.fromEntries(['novel', 'imo2024', 'usamo2025'].flatMap((key, i) => {
          const value = num(r[i + 2]?.text);
          return value === undefined ? [] : [[key, value]];
        })),
        setting: effort ? effort[1].toLowerCase() : undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(date ?? '') ? date : undefined,
      });
    }
    return rows;
  },
};
export default board;

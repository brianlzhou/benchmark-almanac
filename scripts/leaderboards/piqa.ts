// PIQA (Physical Interaction QA). The AI2 board at leaderboard.allenai.org no longer resolves, so this reads
// the PIQA Leaderboard table on the authors' own page, yonatanbisk.com/piqa/, a static HTML table of test
// accuracy (Rank | Model | Accuracy). The model cell holds the system name and, under it, the team; only
// the name is kept. Human, random and majority-class reference rows have no rank and are skipped. The table
// has not changed since 2020, so most entries are BERT-era systems that have no record in data/models.json.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://yonatanbisk.com/piqa/';

const board: Leaderboard = {
  benchmark: 'piqa',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Accuracy)`,
  terms: 'Static GitHub Pages site of the PIQA authors (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    // the row links the GPT-3 paper (arXiv 2005.14165), the 175B model
    'GPT-3': 'gpt-3-175b-davinci',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.map((c) => c.text).join('|') === 'Rank|Model|Accuracy');
    if (!t) throw new Error('PIQA leaderboard table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      if (!/^\d+$/.test(r[0]?.text ?? '')) continue; // reference rows have no rank
      const model = text((r[1]?.html ?? '').split(/<p\b/i)[0]);
      const score = num(r[2]?.text);
      if (!model || score === undefined || /^anonymous$/i.test(model)) continue;
      rows.push({ model, score });
    }
    return rows;
  },
};
export default board;

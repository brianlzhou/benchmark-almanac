// CivBench (Vox Deorum, Civilization V with Vox Populi). The front page of the latest release is static HTML
// whose "Who plays best?" chart is a server-rendered SVG: each `lb-row` link holds the rank, the model name,
// the setup (deciding "every turn", "every 5 turns" or "agentic") and the rating, a pairwise skill rating
// against the built-in AI (about 1500). The rating is the score and the setup becomes the harness, since
// most models are tested in several setups. Rows for the built-in AI are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const PAGE = 'https://vox-deorum.github.io/civ-bench-latest/';

const board: Leaderboard = {
  benchmark: 'civbench',
  url: PAGE,
  feed: `${PAGE} (server-rendered SVG chart "Who plays best?", rating)`,
  terms: 'Static GitHub Pages site of the Vox Deorum project (no robots.txt, so nothing is disallowed); it publishes no terms.',
  aliases: {
    'Opus-5.5': 'claude-opus-5-5',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const rows: LeaderboardRow[] = [];
    for (const m of html.matchAll(/<a class="lb-row[^"]*"[\s\S]*?<\/a>/g)) {
      const a = m[0];
      const model = text(a.match(/<text class="name"[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? '');
      const mode = text(a.match(/<g class="mode[^"]*"[\s\S]*?<text[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? '');
      const score = num(text(a.match(/<text class="val"[^>]*>([\s\S]*?)<\/text>/)?.[1] ?? ''));
      if (!model || score === undefined || /built-in|vox populi|vpai/i.test(model)) continue;
      rows.push({ model, score, harness: mode || undefined });
    }
    if (!rows.length) throw new Error('no CivBench rows');
    return rows;
  },
};
export default board;

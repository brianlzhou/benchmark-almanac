// Thematic Generalization v2 ranks models on 703 cross-family hard cases.
// The importer reads the authors' Markdown results table and ranks by Inverse-Rank Score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/generalization/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "thematic-generalization-v2", url: "https://github.com/lechmazur/generalization#cross-family-hard-subset-leaderboard", feed,
  terms: "Public results published in Lech Mazur’s project README.",
  stats: {
    top1Accuracy: { name: 'Top-1 accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const source = await fetchText(feed);
    const all = markdownTables(source);
    const table = all.find(t => t[0]?.join('|') === "Rank|Model|Top-1 Accuracy|Inverse-Rank Score|Cases");
    if (!table) throw new Error('Results columns changed');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[1];
      const number = (i: number) => {
        const raw = cells[i]?.trim().replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Invalid score for ${model}`);
        return Number(raw);
      };
      const effort = model.match(/^(.+) \(([^()]+reasoning)\)$/i);
      rows.push({ model: effort?.[1] ?? model, score: number(3), metrics: { "top1Accuracy": number(2) }, setting: effort?.[2] });
    }
    if (rows.length < 30) throw new Error('Expected at least 30 published results');
    return rows;
  },
};
export default board;

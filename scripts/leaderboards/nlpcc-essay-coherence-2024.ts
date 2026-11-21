// NLPCC grades logical analysis of Chinese essays. The final Markdown table gives the official three-track average for each team.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/cubenlp/NLPCC-2024-Shared-Task4/main/Result.md";
const board: Leaderboard = {
  benchmark: "nlpcc-essay-coherence-2024",
  url: "https://github.com/cubenlp/NLPCC-2024-Shared-Task4/blob/main/Result.md",
  feed: FEED,
  terms: "The organizers restrict commercial use of competition data and direct academic inquiries to the organizers. https://github.com/cubenlp/NLPCC-2024-Shared-Task4 The host has no published robots directives at /robots.txt.",
  parts: {"track1": "Track 1", "track2": "Track 2", "track3": "Track 3"},
  async fetch() {
    const text = await fetchText(FEED);
    const expected = ["TeamName", "Track1", "Track2", "Track3", "\ud83c\udf89Overall"];
    const table = markdownTables(text).find(t => expected.every(h => t[0]?.includes(h)));
    const [headers = [], ...rows] = table ?? [];
    if (!expected.every(h => headers.includes(h)) || rows.length < 5) throw new Error('Missing leaderboard columns or rows');
    return rows.map(cells => {
      const cell = (name: string) => cells[headers.indexOf(name)]?.trim();
      const number = (name: string) => {
        const raw = cell(name)?.replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Invalid ' + name + ' for ' + cells[0]);
        return Number(raw);
      };
      const model = cell("TeamName")?.replace(/^[🥇🥈🥉]/u, "").trim();
      if (!model) throw new Error('Missing model name');
      return { model, submitter: model, score: number("\ud83c\udf89Overall"), metrics: { "track1": number("Track1"), "track2": number("Track2"), "track3": number("Track3") } };
    });
  },
};
export default board;

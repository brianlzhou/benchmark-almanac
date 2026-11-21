// Aggregate Total Score (Scheme 2). Composite generation systems keep their full names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/microsoft/AVGen-Bench/HEAD/README.md";
const board: Leaderboard = {
  benchmark: "avgen-bench",
  parts: {
    text: { name: 'Text', group: 'Dimension' },
    face: { name: 'Face', group: 'Dimension' },
    music: { name: 'Music', group: 'Dimension' },
    speech: { name: 'Speech', group: 'Dimension' },
    holistic: { name: 'Holistic', group: 'Dimension' },
    visual: { name: 'Visual quality', group: 'Dimension', note: 'Raw 0 to 1 score, multiplied by 100 in the total.' },
    audio: { name: 'Audio quality', group: 'Dimension', note: 'Production quality score, multiplied by 10 in the total.' },
    lowPhysics: { name: 'Low-level kinematic plausibility', group: 'Dimension', note: 'Raw 0 to 5 score, multiplied by 20 in the total.' },
    highPhysics: { name: 'High-level causal reasoning', group: 'Dimension' },
    avSync: { name: 'Audio-visual synchronization', group: 'Dimension' },
    lipSync: { name: 'Lip synchronization', group: 'Dimension' },
  },
  url: "https://microsoft.github.io/AVGen-Bench/",
  feed: FEED,
  terms: "MIT repository; raw.githubusercontent.com has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0]?.includes("Vis"));
    if (!table) throw new Error('Published overall results table is missing');
    const out: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = num(cells[13]);
      if (score === undefined || !cells[0]) continue;
      const metrics: Record<string, number> = {};
      for (const [column, key] of [[2, "visual"], [3, "audio"], [4, "avSync"], [5, "lipSync"], [6, "text"], [7, "face"], [8, "music"], [9, "speech"], [10, "lowPhysics"], [11, "highPhysics"], [12, "holistic"]] as const) {
        const value = num(cells[column]);
        if (value !== undefined) metrics[key] = value;
      }
      out.push({ model: cells[0], score, metrics });
    }
    if (out.length < 3) throw new Error(`Only ${out.length} model rows`);
    return out;
  },
};
export default board;

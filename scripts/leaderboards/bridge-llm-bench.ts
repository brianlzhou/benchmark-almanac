// Bridge LLM Bench compares model bids with Ben SAYC and a second SAYC reference.
// The author's update lists agreement with Ben first for basic and optimized prompts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/albertogerli/bridge-llm-bench/main/docs/bridgewinners_update_1.md";

const board: Leaderboard = {
  benchmark: "bridge-llm-bench",
  url: "https://github.com/albertogerli/bridge-llm-bench/blob/main/docs/bridgewinners_update_1.md",
  feed,
  terms: "The maker identifies the repository license as MIT in the README. The host has no robots.txt.",
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    function rows(first: string, minimum: number) {
      const table = tables.find(t => t[0]?.join('|') === [first, 'vs Ben SAYC', 'vs SAYC Reference'].join('|'));
      if (!table || table.length <= minimum) throw new Error('Missing bridge results: ' + first);
      return table.slice(1).map(([name, ben, reference]) => {
        if (![ben, reference].every(v => /^\d+(?:\.\d+)?%$/.test(v))) throw new Error('Invalid bridge agreement');
        return { model: first === 'Model' ? name : 'Gemini Flash Lite', setting: first === 'Model' ? 'Basic prompt' : name,
          score: parseFloat(ben), metrics: { saycReference: parseFloat(reference) } };
      });
    }
    return [...rows('Model', 6), ...rows('Configuration', 2)];
  },
};
export default board;

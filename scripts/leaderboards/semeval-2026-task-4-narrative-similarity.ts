// SemEval ranks systems on the same story triples using either direct choices or embeddings. The organizers publish team accuracies and system paper links for both tracks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/narrative-similarity-task/narrative-similarity-task.github.io/main/results.md";
const board: Leaderboard = {
  benchmark: 'semeval-2026-task-4-narrative-similarity',
  url: "https://narrative-similarity-task.github.io/results/",
  feed,
  terms: "The site disallows data ZIPs and the raw host has no robots file. The organizers label the results page CC BY-SA 4.0. The table counts 46 teams, with 44 scores for Track A and 27 for Track B. https://narrative-similarity-task.github.io/results/",
  async fetch() {
    const source = await fetchText(feed);
    const table = markdownTables(source).find(t => t[0].join('|') === 'Team|Rank Track A|Accuracy Track A (%)|Rank Track B|Accuracy Track B (%)');
    if (!table || table.length < 47) throw new Error('Missing narrative similarity teams');
    const papers = new Map([...source.matchAll(/^\|\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gm)].map(m => [m[1], m[2]]));
    const rows = [];
    for (const [setting, column, minimum] of [['Track A', 2, 44], ['Track B', 4, 27]] as const) {
      const entries = table.slice(1).filter(c => c[column] !== '-');
      if (entries.length < minimum) throw new Error('Missing results for ' + setting);
      for (const c of entries) {
        const model = c[0], value = c[column];
        if (!model || !value || !Number.isFinite(Number(value))) throw new Error('Invalid narrative score');
        rows.push({ model, submitter: model, setting, score: Number(value), link: papers.get(model) });
      }
    }
    return rows;
  },
};
export default board;

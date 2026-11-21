// Augment Code compares pull request review tools by F-score. The article publishes precision, recall and F-score in its benchmark results table.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = "https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results";
const columns = ["Tool", "Precision", "Recall", "F-score"];

const board: Leaderboard = {
  benchmark: "code-review-evaluation-augment",
  url: "https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results",
  feed: FEED,
  terms: "Reuse terms unverified at https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results The site allows all paths in robots.txt.",
  async fetch() {
    const table = tables(await fetchText(FEED)).find((rows) =>
      columns.every((name, index) => rows[0]?.[index]?.text === name));
    if (!table) throw new Error('Missing results table or expected columns');
    const rows = table.slice(1).map((cells) => {
      const values = cells.map((cell) => cell.text);
      const numberAt = (index: number) => {
        const value = num(values[index]);
        if (value == null) throw new Error(`Missing ${columns[index]} for ${values[0]}`);
        return value;
      };
      if (!values[0]) throw new Error('Missing model name');
      return { model: values[0], score: numberAt(3), metrics: { precision: numberAt(1), recall: numberAt(2) } };
    });
    if (rows.length < 7) throw new Error(`Expected at least 7 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;

// Original LitQA measures accuracy on 50 full-text literature questions. The archived README publishes accuracy, precision and sample counts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Future-House/LitQA/main/README.md";

const board: Leaderboard = {
  benchmark: "litqa-v0-futurehouse",
  url: "https://github.com/Future-House/LitQA",
  feed: FEED,
  terms: "The page provides a public score table. Check its source for license details. https://github.com/Future-House/LitQA GitHub requests a one-second crawl delay.",
  aliases: { 'GPT-4': 'gpt-4-jun-2023', 'Claude-2': 'claude-2' },
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === 'Model|version|Samples|Correct|Incorrect|Unsure|Accuracy (Correct/All)|Precision (Correct/Sure)');
    if (!table || table.length < 11) throw new Error('Missing original LitQA standings');
    return table.slice(1).map(([name, version, ...cells]) => {
      const [trials, correct, incorrect, unsure, score, precision] = cells.map(c => Number(c.replace('%','')));
      if (!name || cells.length !== 6 || ![trials,correct,incorrect,unsure,score,precision].every(Number.isFinite)) throw new Error('Incomplete LitQA result');
      return { model: name.replace('\\_', '_'), setting: version || undefined, score, trials, metrics: { correct, incorrect, unsure, precision } };
    });
  },
};
export default board;

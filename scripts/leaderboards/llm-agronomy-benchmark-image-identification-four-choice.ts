// The June four-choice agronomy image test scores 150 identification questions. Its pinned leaderboard publishes the image score separately from the overall text score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/gbstox/agronomy_llm_benchmarking/14b962a2874d665758d85758b4a0c23a976b4a7b/README.md";

const board: Leaderboard = {
  benchmark: "llm-agronomy-benchmark-image-identification-four-choice",
  stats: { usdPerMillionTokens: { name: 'Price per million tokens', unit: 'usd-per-mtok', better: 'lower' } },
  url: "https://github.com/gbstox/agronomy_llm_benchmarking/blob/14b962a2874d665758d85758b4a0c23a976b4a7b/README.md",
  feed,
  terms: "The repository metadata lists no license. https://github.com/gbstox/agronomy_llm_benchmarking The raw file host has no robots.txt.",
  aliases: { 'google/gemini-3.1-pro-preview-customtools': 'gemini-3-1-pro' },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.includes('Image Identification'));
    if (!table || table[0][3] !== 'Date Tested' || table[0][4] !== 'Price ($/Mtok)') throw new Error('Missing agronomy image table');
    const i = table[0].indexOf('Image Identification');
    const rows = table.slice(1).filter(r => r[i] !== 'N/A').map(r => {
      const score = num(r[i]), price = num(r[4]);
      if (!r[0] || score == null) throw new Error('Invalid image identification score');
      return { model: r[0], score, open: r[2] === 'Open Source', date: r[3], setting: r[0].endsWith('-customtools') ? 'customtools' : undefined,
        metrics: price == null ? undefined : { usdPerMillionTokens: price } };
    });
    if (rows.length < 39) throw new Error('Missing image-capable configurations');
    return rows;
  },
};

export default board;

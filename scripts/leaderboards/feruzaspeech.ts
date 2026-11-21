// FeruzaSpeech measures word error rate on Uzbek read speech. NavAI publishes this test split in its multi-domain ASR standings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/NavAI-pro/uzbek-text-norm/main/LEADERBOARD_ALL.md";

export async function uzbekScores() {
  const header = ['#', 'System', 'Arch', 'macro', 'micro', 'feruza', 'FLEURS', 'USC', 'CV'];
  const table = markdownTables(await fetchText(FEED)).find(([row]) => header.every((h, i) => row[i] === h));
  if (!table || table.length < 35) throw new Error('Expected 34 systems in the Uzbek ASR standings');
  return table.slice(1).map((row) => {
    const system = row[1];
    const model = system.replace(/[★⚠️❓‖]/gu, '').trim();
    const flags = [
      system.includes('⚠') && 'FLEURS test data in training',
      system.includes('❓') && 'Training data undisclosed',
      system.includes('‖') && 'Single-pass decoding',
    ].filter(Boolean);
    const scores = Object.fromEntries(header.slice(3).map((name, i) => {
      const value = row[i + 3];
      if (!value?.trim() || !Number.isFinite(Number(value))) throw new Error(`Missing ${name} for ${model}`);
      return [name, Number(value)];
    }));
    if (!model || !row[2]) throw new Error('Missing system or architecture');
    return { model, setting: [row[2], ...flags].join(' / '), submitter: system.includes('★') ? 'NavAI' : undefined, scores };
  });
}

const board: Leaderboard = {
  benchmark: "feruzaspeech",
  url: "https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LEADERBOARD_ALL.md",
  feed: FEED,
  terms: "Read the feruza column. The repository includes an MIT license. Retain the model-specific training overlap and decoding notes. https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LICENSE GitHub requests a one-second crawl delay.",
  host: 'NavAI',
  async fetch() {
    return (await uzbekScores()).map(({ scores, ...entry }) => ({ ...entry, score: scores.feruza }));
  },
};
export default board;

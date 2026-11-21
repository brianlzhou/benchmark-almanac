// TeleQnA tests telecommunications knowledge. GSMA’s leaderboard CSV stores each accuracy and its standard error as fractions.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/datasets/GSMA/leaderboard/resolve/main/leaderboard_scores.csv";

const board: Leaderboard = {
  benchmark: "teleqna",
  url: "https://huggingface.co/spaces/GSMA/open-telco-leaderboard",
  feed: FEED,
  terms: "GSMA lists the leaderboard dataset under Apache 2.0. https://huggingface.co/datasets/GSMA/leaderboard",
  aliases: {"gemini-2.0-flash-001":"gemini-2-0-flash-feb-2025","llama-v3p3-70b-instruct":"llama-3-3-70b-instruct","command-a":"cohere-command-a","phi-4-14b":"phi-4","deepseek-v3p2":"deepseek-v3-2"},
  async fetch() {
    const data = parseCsv(await fetchText(FEED));
    const rows = data.filter(r => r.teleqna && r.teleqna !== '[]').map(r => {
      const pair: unknown = JSON.parse(r.teleqna);
      if (!r.model || !Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite))
        throw new Error('Invalid TeleQnA score for ' + r.model);
      const [score, stderr] = pair.map(v => v * 100);
      return { model: r.model, score, low: score - stderr, high: score + stderr, metrics: { stderr } };
    });
    if (rows.length < 91) throw new Error('Incomplete TeleQnA table: ' + rows.length);
    return rows;
  },
};
export default board;

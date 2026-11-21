// The GSMA Open Telco Leaderboard reports accuracy on TeleTables. Read the TeleTables score and standard error from its public leaderboard CSV.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/GSMA/open-telco-leaderboard";
const feed = "https://huggingface.co/datasets/GSMA/leaderboard/resolve/main/leaderboard_scores.csv";

const board: Leaderboard = {
  benchmark: 'teletables', url, feed,
  stats: { standardError: { name: 'Standard error', unit: '%', note: 'Standard error of the TeleTables accuracy.' } },
  terms: "GSMA lists the leaderboard dataset under Apache 2.0. https://huggingface.co/datasets/GSMA/leaderboard" ,
  host: 'GSMA Open Telco Leaderboard',
  aliases: {
    "gemini-2.0-flash-001": "gemini-2-0-flash-feb-2025",
    "llama-v3p3-70b-instruct": "llama-3-3-70b-instruct",
    "command-a": "cohere-command-a",
    "phi-4-14b": "phi-4",
    "deepseek-v3p2": "deepseek-v3-2"
  },
  async fetch() {
    const data = parseCsv(await fetchText(feed));
    if (data.length < 91 || !('teletables' in data[0])) throw new Error('Incomplete GSMA table');
    return data.flatMap(r => {
      if (!r.model) throw new Error('Missing model');
      if (r.teletables === '') return [];
      const pair = JSON.parse(r.teletables);
      if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite)) throw new Error('Invalid TeleTables result for ' + r.model);
      return [{model:r.model, score:100*pair[0], metrics:{stderr:100*pair[1]}}];
    });
  },
};
export default board;

// G2 and Bluejay score voice agent platforms out of 100. Bluejay publishes the full October 2026 standings with accuracy and latency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://getbluejay.ai/blog/bluejay-x-g2-voice-ai-agent-platform-evaluations";

const board: Leaderboard = {
  benchmark: "g2-voice-ai-agent-platform-evaluations",
  url: "https://ai.g2.com/evaluations/categories/voice",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host publishes robots.txt at https://getbluejay.ai/robots.txt.",
  async fetch() {
    const required = ["Platform", "Score / 100"];
    const table = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)))
      .find(([header]) => header && required.every(name => header.includes(name)));
    if (!table || table.length <= 6) throw new Error('Incomplete score table');
    const [header, ...entries] = table;
    return entries.map(cells => {
      const cell = (name: string) => cells[header.indexOf(name)];
      const model = cell("Platform");
      const score = num(cell("Score / 100"));
      if (!model || score === undefined) throw new Error('Missing model or headline score');
      const row: LeaderboardRow = { model, score };
      row.trials = 5;
      row.metrics = {};
      for (const name of ['Task success', 'WER, clean', 'Latency, median', 'Latency, p95']) {
        const value = num(cell(name));
        if (value === undefined) throw new Error('Missing platform measure: ' + name);
        row.metrics[name] = value;
      }
      return row;
    });
  },
};
export default board;

// EKWbench ranks model and harness combinations by average verifier-weighted reward. Turing embeds its ranking, uncertainty and category chart in the page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://bench.turing.com/ekw/leaderboard/";

const board: Leaderboard = {
  benchmark: "ekw-turing",
  url: "https://bench.turing.com/ekw/leaderboard/",
  feed,
  terms: "The publisher gives no reuse license on the benchmark page. https://bench.turing.com/ekw/leaderboard/ The robots.txt URL serves the site HTML.",
  stats: {
    allCore: { name: 'All-core reward', unit: '%', better: 'higher' },
    verifierPass: { name: 'Verifier pass rate', unit: '%', better: 'higher' },
    toolCalls: { name: 'Tool calls', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const parts: Record<string, string> = {};
    const categories = new Map<string, Record<string, number>>();
    for (const [, label, model, value] of html.matchAll(/class="cell"[^>]+data-tip="([^"]+?) — ([^"]+?) · [^":]+: ([\d.]+)%"/g)) {
      const key = text(label);
      parts[key] = key;
      const metrics = categories.get(model) ?? {};
      metrics[key] = Number(value);
      categories.set(model, metrics);
    }
    board.parts = parts;
    const rows = [...html.matchAll(/<li data-model="([^"]+)" data-board-rank="\d+" data-sort-score="([\d.]+)" data-sort-all_core="([\d.]+)" data-sort-cost="([\d.]+)" data-sort-output_tokens="(\d+)" data-sort-tool_calls="([\d.]+)"[^>]*>([\s\S]*?)<\/details>/g)]
      .map(([, model, reward, core, cost, tokens, calls, body]) => {
        const detail = text(body);
        const config = detail.match(/evaluated [A-Za-z]+ \d{4}\s+(.+?) · reasoning:\s*(\w+) · (\d+) trials/);
        const interval = detail.match(/Reward\s*[\d.]+%\s*±([\d.]+) pts/);
        const verifier = detail.match(/Verifier pass\s*([\d.]+)%/);
        if (!config || !interval || !verifier || !categories.has(model)) throw new Error('Incomplete EKW result for ' + model);
        const score = Number(reward) * 100, error = Number(interval[1]);
        return { model, harness: config[1], setting: config[2], trials: Number(config[3]), score, low: score - error, high: score + error,
          cost: Number(cost), tokens: Number(tokens), metrics: { ...categories.get(model), allCore: Number(core) * 100, verifierPass: Number(verifier[1]), toolCalls: Number(calls) } };
      });
    if (rows.length < 6) throw new Error('Missing EKW configurations');
    return rows;
  },
};

export default board;

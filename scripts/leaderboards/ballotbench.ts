// BallotBench ranks election forecasts by mean Brier score on AP-called races. The election page combines its embedded forecasts with its live updates.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";

const board: Leaderboard = {
  benchmark: "ballotbench",
  harnesses: 'system',
  url: "https://ballotbench.com",
  feed: "https://ballotbench.com",
  terms: "BallotBench disallows crawlers during forecasting. The public election page credits Thoughtful Lab and specifies no separate score license.",
  stats: { favoriteWon:{name:'Favorite won',unit:'count'} },
  async fetch() {
    const page = await fetchText(this.url);
    const state = JSON.parse(page.match(/<script id="election-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1] || '');
    const read = async (path: string) => {
      await new Promise(resolve => setTimeout(resolve, 1050));
      return JSON.parse(await fetchText(new URL(path, this.url).href));
    };
    const head = await read(state.meta.live);
    const calls = await read(state.meta.calls + '?n=' + head.calls.n);
    const updates = await read(state.meta.forecasts + '?v=' + head.fv);
    const rows = [];
    for (const agent of state.agents) {
      let total = 0, called = 0, favoriteWon = 0;
      for (const [i, contest] of state.contests.entries()) {
        const [id,,,,, options] = contest;
        const ap = calls.desk[id]?.find((call: string[]) => call[0] === 'ap');
        if (!ap) continue;
        const winner = options.findIndex(([name]: string[]) => name === ap[1]);
        if (winner < 0) continue;
        const updated = updates.f?.[agent.key]?.[id];
        const forecast: number[] = updated ? options.map(([name]: string[]) => updated[name] ?? 0) : state.f[agent.key]?.[i];
        if (!Array.isArray(forecast) || !forecast.length) continue;
        if (forecast.length !== options.length || !forecast.every(Number.isFinite)) throw new Error('Invalid forecast');
        total += forecast.reduce((sum, p, j) => sum + (p / 1000 - Number(j === winner)) ** 2, 0);
        if (forecast.every((p, j) => j === winner || p < forecast[winner])) favoriteWon++;
        called++;
      }
      if (called) rows.push({ model: agent.label, harness: agent.harness, score: total / called, metrics: { favoriteWon } });
    }
    if (rows.length < 9) throw new Error('Missing BallotBench forecasters');
    return rows;
  },
};
export default board;

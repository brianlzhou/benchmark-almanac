// WebHarbor (AIMING Lab): the 306-task verified test set, with success rates in percent.
// The page embeds chart-data JSON. Use only testset.verifier, the scripted verifier's headline
// success rate; the independent judge and agreement rate are diagnostics. Other chart series
// concern WebVoyager, Online-Mind2Web, WebArena or fidelity subsets, not this benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://aiming-lab.github.io/WebHarbor/';
interface Row { model: string; harness: string; verifier: number; judge: number; agree: number }
const board: Leaderboard = {
  benchmark: 'webharbor',
  url: `${PAGE}#results`,
  feed: `${PAGE} (chart-data JSON, testset.verifier)`,
  terms: 'AIMING Lab publishes the project page and benchmark repository; no separate license for the embedded results was found.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const raw = html.match(/<script\b[^>]*id="chart-data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!raw) throw new Error('WebHarbor chart-data missing');
    const d = JSON.parse(raw) as { testset: Row[] };
    if (!d.testset?.length) throw new Error('WebHarbor testset missing');
    return d.testset.map(r => {
      if (!r.model || ![r.verifier,r.judge,r.agree].every(Number.isFinite)) throw new Error('WebHarbor invalid row');
      return { model: r.model, harness: r.harness, score: r.verifier, metrics: { judge: r.judge, agreement: r.agree } };
    });
  },
};
export default board;

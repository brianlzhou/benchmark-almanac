// Legal Benchmarks compares applications on contract work. Its ranking is the percentage of tasks each application passes.
// The page sends application results and form scores to the table in its embedded Next.js data.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

export const applicationsUrl = 'https://www.legalbenchmarks.ai/leaderboard/applications';
export const applicationsTerms = 'Legal Benchmarks publishes application rankings. Its robots.txt allows the page. No separate score reuse license was identified.';
export async function applicationRows(key: 'draftingData' | 'extractionData', min: number): Promise<LeaderboardRow[]> {
  const flight = nextFlight(await fetchText(applicationsUrl));
  type Entry = { name: string; provider: string; reliability: number; usefulness: number };
  const entries = jsonAfter<Entry[]>(flight, '"' + key + '":');
  if (entries.length < min) throw new Error('Missing Legal Benchmarks applications');
  return entries.map(r => {
    if (!r.name || !r.provider || !Number.isFinite(r.reliability) || !Number.isFinite(r.usefulness))
      throw new Error('Invalid Legal Benchmarks application');
    return { model: r.name, harness: r.name, agentOrg: r.provider, score: r.reliability, metrics: { form: r.usefulness } };
  });
}
const board: Leaderboard = {
  benchmark: 'legalbenchmarks-contract-workflows-applications',
  url: applicationsUrl, feed: applicationsUrl, terms: applicationsTerms, harnesses: 'system',
  fetch: () => applicationRows('draftingData', 10),
};
export default board;

// BuildArena publishes the final Season 1 ranking for autonomous and assisted Besiege entries.
// Read final scores, cost deductions and performance components from the site's application bundle.
// Random Walk is a random controller, not a model, so the board leaves it out.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://build-arena.github.io/ConstructionChallenge/";
const board: Leaderboard = {
  benchmark: "buildarena-2-0",
  notModels: /^Random Walk$/,
  url: "https://build-arena.github.io/ConstructionChallenge/",
  feed: FEED,
  terms: "The public Season 1 results page gives no separate score license. Its robots URL returns HTML.",
  stats: { blockPoints: { name: 'Block points', unit: 'count' }, costDeduction: { name: 'Cost deduction', unit: 'score', better: 'lower' }, errorDeduction: { name: 'Error deduction', unit: 'score', better: 'lower' }, failed: { name: 'Failed operations', unit: 'count' }, integrity: { name: 'Integrity', unit: 'score', better: 'higher' }, mechanicalDeduction: { name: 'Mechanical deduction', unit: 'score', better: 'lower' }, operations: { name: 'Operations', unit: 'count' }, orbit: { name: 'Orbit score', unit: 'score', better: 'higher' }, performance: { name: 'Performance', unit: 'score', better: 'higher' }, rawFinalScore: { name: 'Raw final score', unit: 'score', better: 'higher' }, speed: { name: 'Speed', unit: 'score', better: 'higher' }, tokenDeduction: { name: 'Token deduction', unit: 'score', better: 'lower' }, submissionTokens: { name: 'Submission tokens', unit: 'tokens' } },
  async fetch() {
    const page = await fetchText(FEED);
    const script = page.match(/<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error('Missing BuildArena application bundle');
    const bundle = await fetchText(new URL(script, FEED).href);
    const rows = [];
    for (const [entry] of bundle.matchAll(/\{submissionId:`[^`]*`,team:`[^`]*`,title:`[^`]*`,url:`[^`]*`,rank:\d+,mode:`[^`]*`,finalScore:[^{}]+\}/g)) {
      const fields = Object.fromEntries([...entry.matchAll(/(\w+):(?:`([^`]*)`|(-?[\d.eE+-]+))/g)].map(m => [m[1], m[2] ?? Number(m[3])]));
      const metrics: Record<string, number> = {};
      for (const key of ['rawFinalScore', 'performance', 'cost', 'orbit', 'speed', 'integrity', 'mechanicalDeduction', 'tokenDeduction', 'errorDeduction', 'blockPoints', 'tokens', 'failed', 'operations']) {
        const value = fields[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing BuildArena field ' + key);
        const metricKey = key === 'cost' ? 'costDeduction' : key === 'tokens' ? 'submissionTokens' : key;
        metrics[metricKey] = value;
      }
      rows.push({ model: String(fields.title), submitter: String(fields.team), setting: String(fields.mode), link: String(fields.url), score: Number(fields.finalScore), metrics });
    }
    if (rows.length < 40) throw new Error('Missing Season 1 ranked entries');
    return rows;
  },
};
export default board;

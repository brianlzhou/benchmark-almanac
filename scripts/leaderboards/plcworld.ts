// PLCWorld tests controller programs in a simulated plant. Task Success counts successful cases across both suites.
// The release manifest supplies overall rates, the interval file supplies 95% limits, and the board gives six group scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const repo = 'https://raw.githubusercontent.com/yunji0516/PLCWorld/HEAD/results/';
const feed = repo + 'manifest.json';
const site = 'https://yunji0516.github.io/PLCWorld/';
type Overall = { SR: { value: number }, SVR: { value: number }, execution_gap_local_submission_profile: { value: number } };
type Manifest = {
  direct_generation: { model: string, metrics: Overall, repetitions: number }[],
  generation_and_verification: { method: string, overall: Overall }[],
};
type SiteRow = [string, number[], number[], number];
const parts = { motionEasy: 'Motion Control: Easy', motionMedium: 'Motion Control: Medium', motionHard: 'Motion Control: Hard',
  materialEasy: 'Material Handling: Easy', materialMedium: 'Material Handling: Medium', materialHard: 'Material Handling: Hard' };
const board: Leaderboard = {
  benchmark: 'plcworld', url: site + '#results', feed, parts, harnesses: 'system',
  stats: {
    safetyViolationRate: { name: 'Safety violation rate', unit: '%', better: 'lower' },
    executionGap: { name: 'Execution gap', unit: '%', better: 'lower', note: 'Execution gap from the local submission profile.' },
    motionEasySVR: { name: 'Motion control easy safety violation rate', unit: '%', better: 'lower' },
    motionMediumSVR: { name: 'Motion control medium safety violation rate', unit: '%', better: 'lower' },
    motionHardSVR: { name: 'Motion control hard safety violation rate', unit: '%', better: 'lower' },
    materialEasySVR: { name: 'Material handling easy safety violation rate', unit: '%', better: 'lower' },
    materialMediumSVR: { name: 'Material handling medium safety violation rate', unit: '%', better: 'lower' },
    materialHardSVR: { name: 'Material handling hard safety violation rate', unit: '%', better: 'lower' },
  },
  terms: 'The authors publish this release on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  async fetch() {
    const manifest = await fetchJson<Manifest>(feed);
    const intervals = await fetchJson<{SR_ci95_percent: Record<string, number[]>}>(repo + 'confidence-intervals.json');
    const page = await fetchText(site);
    const script = /<script src="(app\.js[^"]*)"/.exec(page)?.[1];
    if (!script) throw new Error('Board script missing');
    const js = await fetchText(new URL(script, site).href);
    const match = /const results=(\{[^\n]+\});/.exec(js);
    if (!match || !js.includes('GPT-5.5 backbone')) throw new Error('Board table or workflow backbone missing');
    const published: {direct: SiteRow[], frameworks: SiteRow[]} = JSON.parse(match[1]);
    const rows: LeaderboardRow[] = [];
    function add(siteRow: SiteRow, id: string, model: string, overall: Overall, trials: number, setting: string, harness?: string) {
      const [low, high] = intervals.SR_ci95_percent[id];
      const metrics: Record<string, number> = { safetyViolationRate: 100 * overall.SVR.value, executionGap: 100 * overall.execution_gap_local_submission_profile.value };
      const cells = [...siteRow[1], ...siteRow[2]];
      if (cells.length !== 12 || ![...cells, low, high, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Missing PLCWorld column');
      Object.keys(parts).forEach((key, i) => { metrics[key] = cells[2*i]; metrics[key + 'SVR'] = cells[2*i+1]; });
      rows.push({ model, score: 100 * overall.SR.value, trials, low, high, metrics, setting, harness });
    }
    for (const row of published.direct) {
      const id = row[0].toLowerCase().replaceAll(' ', '-');
      const entry = manifest.direct_generation.find(r => r.model === id);
      if (!entry) throw new Error('Missing direct result for ' + id);
      add(row, id, row[0], entry.metrics, entry.repetitions, 'Direct generation');
    }
    for (const row of published.frameworks) {
      const direct = row[0] === 'Direct (GPT-5.5, matched)';
      const id = direct ? 'direct-gpt-5.5-matched' : row[0].toLowerCase();
      const entry = manifest.generation_and_verification.find(r => r.method === id);
      if (!entry) throw new Error('Missing workflow result for ' + id);
      add(row, id, 'GPT-5.5', entry.overall, 1, 'Matched workflow comparison', direct ? undefined : row[0]);
    }
    return checked(rows, 11);
  },
};
export default board;

// WorldLeague: evaluates 13 embodied AI systems (VLMs and VLA policies) on 60 interactive real-world physical tasks
// across six domains (Navigation, Grounding, Geometry, Physics, Memory, Constraints). Reads the #results leaderboard
// table from the official site and pairs it with wall-clock time and token counts from assets/site/site.js.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://xyangzhou.github.io/WorldLeague/';
const SITE_JS = `${PAGE}assets/site/site.js`;

const DIMS = ['navigation', 'grounding', 'geometry', 'physics', 'memory', 'constraints'] as const;

function parseResources(js: string): Map<string, [number, number | undefined]> {
  const m = js.match(/const resources\s*=\s*\{([\s\S]*?)\};/);
  if (!m) throw new Error('WorldLeague resources table not found in site.js');
  const map = new Map<string, [number, number | undefined]>();
  for (const hit of m[1].matchAll(/"([^"]+)"\s*:\s*\[([^\]]+)\]/g)) {
    const nums = hit[2].split(',').map((s) => Number(s.trim()));
    if (Number.isFinite(nums[0])) {
      map.set(hit[1], [nums[0], Number.isFinite(nums[1]) ? nums[1] : undefined]);
    }
  }
  return map;
}

const board: Leaderboard = {
  benchmark: 'worldleague',
  url: `${PAGE}#results`,
  feed: `${PAGE} (table #results and assets/site/site.js)`,
  terms: 'Published openly on GitHub Pages by the WorldLeague authors with no robots.txt restrictions.',
  parts: {
    navigation: { name: 'Navigation', group: 'Domain' },
    grounding: { name: 'Grounding', group: 'Domain' },
    geometry: { name: 'Geometry', group: 'Domain' },
    physics: { name: 'Physics', group: 'Domain' },
    memory: { name: 'Memory', group: 'Domain' },
    constraints: { name: 'Constraints', group: 'Domain' },
  },
  stats: {
    physicalSuccess: { name: 'Physical success', unit: '%', better: 'higher', note: 'Share of physical tasks completed successfully.' },
    wallMinutes: { name: 'Evaluation time', unit: 'minutes', better: 'lower', note: 'Mean elapsed minutes per task.' },
    tokensMillions: { name: 'Tokens', unit: 'millions', better: 'lower', note: 'Mean millions of tokens per task.' },
  },
  chart: {
    title: 'Efficiency Pareto frontier',
    note: 'Interactive Score against evaluation time in minutes, matching the efficiency scatter plot on the WorldLeague leaderboard.',
    x: { key: 'wallMinutes', label: 'Evaluation time', unit: 'min', better: 'lower' },
    y: { key: 'score', label: 'Interactive Score', better: 'higher' },
  },
  async fetch() {
    const [html, js] = await Promise.all([fetchText(PAGE), fetchText(SITE_JS)]);
    const resources = parseResources(js);
    const tblMatch = html.match(/<table[^>]*id="results"[\s\S]*?<\/table>/);
    if (!tblMatch) throw new Error('WorldLeague #results table not found');
    const tbodyMatch = tblMatch[0].match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) throw new Error('WorldLeague tbody not found');
    const out: LeaderboardRow[] = [];
    for (const tr of tbodyMatch[1].matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)) {
      const attrs = tr[1];
      const inner = tr[2];
      const nameMatch = inner.match(/<span class="model-name">([^<]+)<\/span>/);
      const scoreMatch = inner.match(/<td class="score-cell">([^<]+)<\/td>/);
      const succMatch = inner.match(/<td class="success-cell">([^<]+)<\/td>/);
      const dimMatch = attrs.match(/data-dimensions="([^"]+)"/);
      if (!nameMatch || !scoreMatch || !succMatch || !dimMatch) continue;
      const model = nameMatch[1].trim();
      const score = Number(scoreMatch[1].trim());
      const physicalSuccess = Number(succMatch[1].replace('%', '').trim());
      const dims = JSON.parse(dimMatch[1].replace(/&quot;/g, '"')) as [number, number][];
      if (!Number.isFinite(score) || !Number.isFinite(physicalSuccess) || dims.length !== DIMS.length) {
        throw new Error(`Invalid WorldLeague row for ${model}`);
      }
      const metrics: Record<string, number> = { physicalSuccess };
      for (let i = 0; i < DIMS.length; i++) {
        if (Number.isFinite(dims[i][0])) metrics[DIMS[i]] = dims[i][0];
      }
      const res = resources.get(model);
      if (res) {
        metrics.wallMinutes = res[0];
        if (res[1] !== undefined) metrics.tokensMillions = res[1];
      }
      out.push({ model, score, metrics });
    }
    if (out.length < 10) throw new Error(`WorldLeague returned only ${out.length} rows`);
    return out;
  },
};
export default board;

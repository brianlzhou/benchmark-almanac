// EgoDepth-Bench: evaluates foundation metric-depth and 3D reconstruction models on synchronized multi-camera
// egocentric manipulation video with laser-scanned ground truth, reporting AbsRel (lower is better), MAE_Z in cm,
// delta-1 accuracy, and coverage across full-image, hand, and object subsets. Reads the HTML table from
// egodepth-bench.github.io.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://egodepth-bench.github.io/';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shortRegime(header: string): string {
  const idx = header.indexOf(':');
  return (idx > 0 ? header.slice(0, idx) : header).trim();
}

const board: Leaderboard = {
  benchmark: 'egodepth-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by the EgoDepth-Bench authors with no robots.txt restrictions.',
  parts: {
    handsMae: { name: 'Hands MAE Z (cm)', group: 'Subset', unit: 'score', better: 'lower', note: 'Depth mean absolute error in centimeters on the annotated hands subset.' },
    objectsMae: { name: 'Objects MAE Z (cm)', group: 'Subset', unit: 'score', better: 'lower', note: 'Depth mean absolute error in centimeters on the annotated objects subset.' },
  },
  stats: {
    fullMae: { name: 'Full image MAE Z (cm)', unit: 'score', better: 'lower', note: 'Depth mean absolute error in centimeters across the full image.' },
    delta1: { name: 'Delta 1 accuracy', unit: 'score', better: 'higher', note: 'Fraction of pixels within a 1.25x relative depth threshold.' },
    coverage: { name: 'Full image coverage', unit: '%', better: 'higher' },
    handsCoverage: { name: 'Hands coverage', unit: '%', better: 'higher' },
    objectsCoverage: { name: 'Objects coverage', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const tblMatch = html.match(/<table[\s\S]*?<\/table>/);
    if (!tblMatch) throw new Error('EgoDepth-Bench results table not found');
    const out: LeaderboardRow[] = [];
    let regime = 'Metric monocular';
    for (const tr of tblMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => stripTags(m[1]));
      if (cells.length === 1 && cells[0]) {
        regime = shortRegime(cells[0]);
        continue;
      }
      if (cells.length < 10) continue;
      const views = Number(cells[1]);
      const nums = cells.slice(2, 10).map(Number);
      if (!Number.isFinite(views) || !nums.every(Number.isFinite)) continue;
      let model = cells[0];
      let extraSetting = '';
      if (model === 'MapAnything + rig') {
        model = 'MapAnything';
        extraSetting = 'rig, ';
      }
      const [absRel, fullMae, delta1, coverage, handsMae, handsCoverage, objectsMae, objectsCoverage] = nums;
      const viewLabel = views === 1 ? '1 view' : `${views} views`;
      out.push({
        model,
        setting: `${regime}, ${extraSetting}${viewLabel}`,
        score: absRel,
        metrics: {
          fullMae,
          delta1,
          coverage,
          handsMae,
          handsCoverage,
          objectsMae,
          objectsCoverage,
        },
      });
    }
    if (out.length < 15) throw new Error(`EgoDepth-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;

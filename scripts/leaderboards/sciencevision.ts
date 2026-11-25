// ScienceVision (UniPat AI). The leaderboard on unipat.ai/blog/ScienceVision is drawn from
// /static/sciencevision/data/benchmark.js, a plain data script (`window.SV_BENCHMARK = {...}`): per model
// the mean answer_score (0 to 1, ineligible trials counted zero, mean of three runs) under three settings.
// The board ranks by the "cc-3d" setting (source access with code), the page's headline ("best mean answer
// score ... 3D"), so that mean is the score, in the record's 0-to-1 unit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://unipat.ai/blog/ScienceVision';
const FEED = 'https://unipat.ai/static/sciencevision/data/benchmark.js';

interface SettingScore {
  mean?: number;
  runs?: number;
  byDomain?: Record<string, number>;
}
interface Data {
  leaderboard: { models: { label: string; group?: string; settings: Record<string, SettingScore> }[] };
}

const board: Leaderboard = {
  benchmark: 'sciencevision',
  url: `${PAGE}#leaderboard`,
  feed: `${FEED} (leaderboard.models, cc-3d mean)`,
  terms: 'Static data script on unipat.ai; robots.txt allows all paths and the site publishes no terms of use.',
  aliases: {
    'Hunyuan-4 Preview': 'tencent-hy4-preview',
  },
  parts: {
    architecture: 'Architecture',
    biology: 'Biology',
    chemistry: 'Chemistry',
    mechanicalCad: 'Mechanical CAD',
    medical: 'Medical imaging',
  },
  stats: {
    ccMcp: { name: 'Code and MCP setting', unit: 'score', better: 'higher' },
    cc2d6: { name: '2D multi-view setting', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const data = jsonAfter<Data>(await fetchText(FEED), 'window.SV_BENCHMARK =');
    const domainMap = [
      ['architecture', 'architecture'],
      ['biology', 'biology'],
      ['chemistry', 'chemistry'],
      ['mechanical-cad', 'mechanicalCad'],
      ['medical', 'medical'],
    ] as const;
    const rows: LeaderboardRow[] = [];
    for (const m of data.leaderboard.models) {
      const s3d = m.settings['cc-3d'];
      const score = s3d?.mean;
      if (typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const [src, key] of domainMap) {
        const v = s3d.byDomain?.[src];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[key] = Number(v.toFixed(4));
      }
      const mcp = m.settings['cc-mcp']?.mean;
      const v2d = m.settings['cc-2d-6']?.mean;
      if (typeof mcp === 'number' && Number.isFinite(mcp)) metrics.ccMcp = mcp;
      if (typeof v2d === 'number' && Number.isFinite(v2d)) metrics.cc2d6 = v2d;
      const open = m.group === 'open' ? true : m.group === 'closed' ? false : undefined;
      rows.push({
        model: m.label,
        score,
        ...(open !== undefined ? { open } : {}),
        ...(typeof s3d.runs === 'number' ? { trials: s3d.runs } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no cc-3d scores in the ScienceVision data');
    return rows;
  },
};
export default board;

// AnimWeb-Bench: evaluates multimodal LLMs on recreating real animated web pages from video recordings across four
// Static Appearance Fidelity metrics (Structure, Text, Color, CLIP) and four Animation Fidelity metrics (Position,
// Size, Velocity, CLIP). Reads the official HTML model table from starry1001.github.io/AnimWeb-Bench-website/.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://starry1001.github.io/AnimWeb-Bench-website/';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const board: Leaderboard = {
  benchmark: 'animweb-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on GitHub Pages by the AnimWeb-Bench authors with no robots.txt restrictions.',
  headline: 'Plain mean of the four Static Appearance Fidelity and four Animation Fidelity metrics (0 to 1), since the leaderboard reports the eight dimensions separately.',
  parts: {
    staticStructure: { name: 'Structure', group: 'Static appearance' },
    staticText: { name: 'Text', group: 'Static appearance' },
    staticColor: { name: 'Color', group: 'Static appearance' },
    staticClip: { name: 'CLIP', group: 'Static appearance' },
    animPosition: { name: 'Position', group: 'Animation fidelity' },
    animSize: { name: 'Size', group: 'Animation fidelity' },
    animVelocity: { name: 'Velocity', group: 'Animation fidelity' },
    animClip: { name: 'CLIP', group: 'Animation fidelity' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
    const resTable = tables.find((t) => t.includes('Static Appearance Fidelity') && t.includes('Proprietary MLLMs'));
    if (!resTable) throw new Error('AnimWeb-Bench model results table not found');
    const out: LeaderboardRow[] = [];
    for (const tr of resTable.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => stripTags(m[1]));
      if (cells.length < 9) continue;
      const nums = cells.slice(1, 9).map(Number);
      if (!nums.every(Number.isFinite)) continue;
      const model = cells[0].replace(/[†*]+/g, '').trim();
      const [staticStructure, staticText, staticColor, staticClip, animPosition, animSize, animVelocity, animClip] = nums;
      const meanScore = nums.reduce((a, b) => a + b, 0) / nums.length;
      out.push({
        model,
        score: Number(meanScore.toFixed(4)),
        metrics: {
          staticStructure,
          staticText,
          staticColor,
          staticClip,
          animPosition,
          animSize,
          animVelocity,
          animClip,
        },
      });
    }
    if (out.length < 10) throw new Error(`AnimWeb-Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;

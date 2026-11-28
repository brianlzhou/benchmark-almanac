// Artisan evaluates articulated 3D asset generation pipelines and models on joint collision rates in physics simulation.
// The project page leaderboard reports Single-joint (headline, lower better), Double-joint, and Multi-joint collision rates (%).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = 'https://physicalvision.github.io/artisan/';

const HARNESS_PREFIX = /^(Artisan|Codex|Articraft|Agy)\s+(.+)$/;

const board: Leaderboard = {
  benchmark: 'artisan-3d',
  static: 'paper',
  url: feed,
  feed,
  terms: 'Oxford VGG and ETH Zurich PhysicalVision publish the quantitative benchmark table on their project page and in arXiv:2610.13947.',
  harnesses: 'system',
  aliases: {
    'Gemini-Flash-3.8': 'gemini-3-8-flash',
  },
  parts: {
    doubleJointCollision: { name: 'Double-joint collision', group: 'Joint complexity', unit: '%', better: 'lower' },
    multiJointCollision: { name: 'Multi-joint collision', group: 'Joint complexity', unit: '%', better: 'lower' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
    const target = tables.find((t) => /Single-joint collision/i.test(t) && /Double-joint collision/i.test(t));
    if (!target) throw new Error('Missing Artisan joint collision table');
    const trs = target.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const rows: LeaderboardRow[] = [];
    for (const tr of trs.slice(1)) {
      const cells = (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map((c) => text(c).replace(/\s+/g, ' ').trim());
      if (cells.length < 5) continue;
      const [, rawName, singleS, doubleS, multiS] = cells;
      const score = Number(singleS.replace(/%/g, '').trim());
      const doubleJointCollision = Number(doubleS.replace(/%/g, '').trim());
      const multiJointCollision = Number(multiS.replace(/%/g, '').trim());
      if (!rawName || !Number.isFinite(score)) continue;

      let namePart = rawName;
      let setting: string | undefined;
      if (rawName.includes('·')) {
        const [left, right] = rawName.split('·').map((s) => s.trim());
        namePart = left;
        setting = right;
      }

      const hm = namePart.match(HARNESS_PREFIX);
      const row: LeaderboardRow = {
        model: hm ? hm[2] : namePart,
        score,
        metrics: { doubleJointCollision, multiJointCollision },
      };
      if (hm) row.harness = hm[1];
      if (setting) row.setting = setting;
      rows.push(row);
    }
    if (rows.length < 13) throw new Error(`Expected 13 Artisan configurations, got ${rows.length}`);
    return rows;
  },
};

export default board;

// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Arti4D tests recognition of sliding and rotating joints in egocentric videos. Table 1 gives accuracy by joint type.
// Axis-angle and distance errors are separate measures. Table 2 adds easy and hard split results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2509.01708';
const board: Leaderboard = {
  benchmark: 'arti4d', static: 'paper', feed, url: feed,
  terms: 'The authors publish the tables on arXiv. https://arxiv.org/abs/2509.01708',
  headline: 'The paper reports no overall type accuracy, so the headline is the plain mean of accuracy on prismatic and revolute joints.',
  parts: { prismatic: 'Prismatic', revolute: 'Revolute', easyPrismatic: 'Easy prismatic', easyRevolute: 'Easy revolute',
    hardPrismatic: 'Hard prismatic', hardRevolute: 'Hard revolute' },
  stats: {
    prismaticAngleDegrees: { name: 'Prismatic axis-angle error', unit: 'score', better: 'lower', note: 'Axis-angle error in degrees for prismatic joints.' },
    revoluteAngleDegrees: { name: 'Revolute axis-angle error', unit: 'score', better: 'lower', note: 'Axis-angle error in degrees for revolute joints.' },
    revoluteDistanceMeters: { name: 'Revolute positional error', unit: 'score', better: 'lower', note: 'Positional error in meters for revolute joints.' },
  },
  async fetch() {
    const ts = paperTables(await paperHtml(feed)).map(grid);
    const main = ts.find(t => t[0][0] === 'Method' && t[1]?.slice(-2).join() === 'Prismatic,Revolute' && t.some(r => r[0] === 'Ditto'));
    const levels = ts.find(t => t[1]?.[0] === 'Diff.' && t[1]?.slice(-2).join() === 'Prismatic,Revolute');
    if (!main || !levels) throw new Error('Missing Arti4D results');
    const rows: LeaderboardRow[] = [];
    for (const [name, ...v] of main.slice(2)) {
      if (!/^(ArtGS|Ditto|ArtiPoint)/.test(name)) continue;
      if (v.length !== 6 || ![v[0], v[2], v[3], v[4], v[5]].every(s => /^\d+(\.\d+)?$/.test(s))) throw new Error('Changed Arti4D values');
      const prismatic = Number(v[4]) * 100, revolute = Number(v[5]) * 100;
      const metrics: Record<string, number> = { prismatic, revolute, prismaticAngleDegrees: Number(v[0]), revoluteAngleDegrees: Number(v[2]), revoluteDistanceMeters: Number(v[3]) };
      for (const [diff, model, ...cells] of levels.slice(2)) {
        if (model !== name.replace(' (ours)', '')) continue;
        const key = diff.toLowerCase();
        metrics[key + 'Prismatic'] = Number(cells[4]) * 100;
        metrics[key + 'Revolute'] = Number(cells[5]) * 100;
      }
      rows.push({ model: name.split(' ')[0], setting: name.includes(' w/') ? name.split(' w/ ')[1].replace(/\s*\[\s*\d+\s*\]/g, '') : undefined,
        score: (prismatic + revolute) / 2, metrics });
    }
    return checked(rows, 5);
  },
};
export default board;

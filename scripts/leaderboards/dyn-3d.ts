// Dyn-3D evaluates vision-language models on resolving ego-motion ambiguity across dynamic videos.
// Table 2 on the project page reports Overall accuracy (%) and three reasoning categories (Kinematic, Spatial, Trajectory).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = 'https://inkmind-ai.github.io/Dyn-3D/';

const parseNum = (s: string) => Number(s.replace(/\([^)]*\)/g, '').trim());

const board: Leaderboard = {
  benchmark: 'dyn-3d',
  static: 'paper',
  url: feed,
  feed,
  terms: 'InkMind-AI publishes the Dyn-3D quantitative table on the project page and in arXiv:2609.01059.',
  aliases: {
    'GPT-4o': 'gpt-4o-may-2024',
    'Qwen2.5-VL-7B-Instruct': 'qwen2-5-vl-7b',
    'LLaVA-Video': 'llava-video-7b-qwen2',
  },
  parts: {
    kinematic: { name: 'Kinematic', group: 'Category' },
    spatial: { name: 'Spatial', group: 'Category' },
    trajectory: { name: 'Trajectory', group: 'Category' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
    const target = tables.find((t) => /Kinematic/i.test(t) && /Spatial/i.test(t) && /Trajectory/i.test(t) && /Overall/i.test(t));
    if (!target) throw new Error('Missing Dyn-3D benchmark table');
    const trs = target.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const rows: LeaderboardRow[] = [];
    for (const tr of trs.slice(1)) {
      const cells = (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map((c) => text(c).replace(/\s+/g, ' ').trim());
      if (cells.length < 5) continue;
      const [model, kinS, spaS, traS, ovrS] = cells;
      const score = parseNum(ovrS);
      const kinematic = parseNum(kinS);
      const spatial = parseNum(spaS);
      const trajectory = parseNum(traS);
      if (!model || !Number.isFinite(score)) continue;
      rows.push({
        model,
        score,
        metrics: { kinematic, spatial, trajectory },
      });
    }
    if (rows.length < 10) throw new Error(`Expected 10 Dyn-3D rows, got ${rows.length}`);
    return rows;
  },
};

export default board;

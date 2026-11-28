// DRBench Pro — Zhejiang University and Tencent knowledge-centric deep research agent benchmark.
// Reads live JSON feeds from https://zjureal.com/DRBenchPro/assets/data/{results,domain-results}.json
// covering 16 frontier models and deep research systems across 144 cases and 24 domains.

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SITE = 'https://zjureal.com/DRBenchPro/';
const FEED = 'https://zjureal.com/DRBenchPro/assets/data/results.json';
const DOMAIN_FEED = 'https://zjureal.com/DRBenchPro/assets/data/domain-results.json';

interface GlobalEntry {
  system_id: string;
  name: string;
  category: string;
  overall_percent: number;
  breadth_percent?: number;
  depth_percent?: number;
}

interface GlobalPayload {
  results: GlobalEntry[];
}

interface DomainEntry {
  name: string;
  results: {
    system_id: string;
    overall_percent: number;
  }[];
}

interface DomainPayload {
  domains: DomainEntry[];
}

const DOMAIN_KEYS: Record<string, { key: string; name: string }> = {
  Adult: { key: 'adult', name: 'Adult' },
  'Art & Design': { key: 'artDesign', name: 'Art & Design' },
  'Crime & Law': { key: 'crimeLaw', name: 'Crime & Law' },
  'Education & Jobs': { key: 'educationJobs', name: 'Education & Jobs' },
  Entertainment: { key: 'entertainment', name: 'Entertainment' },
  'Fashion & Beauty': { key: 'fashionBeauty', name: 'Fashion & Beauty' },
  'Finance & Business': { key: 'financeBusiness', name: 'Finance & Business' },
  'Food & Dining': { key: 'foodDining', name: 'Food & Dining' },
  Games: { key: 'games', name: 'Games' },
  Hardware: { key: 'hardware', name: 'Hardware' },
  Health: { key: 'health', name: 'Health' },
  History: { key: 'history', name: 'History' },
  'Home & Hobbies': { key: 'homeHobbies', name: 'Home & Hobbies' },
  Industrial: { key: 'industrial', name: 'Industrial' },
  Literature: { key: 'literature', name: 'Literature' },
  Politics: { key: 'politics', name: 'Politics' },
  Religion: { key: 'religion', name: 'Religion' },
  'Science & Technology': { key: 'scienceTechnology', name: 'Science & Technology' },
  'Social Life': { key: 'socialLife', name: 'Social Life' },
  Software: { key: 'software', name: 'Software' },
  'Software Development': { key: 'softwareDevelopment', name: 'Software Development' },
  'Sports & Fitness': { key: 'sportsFitness', name: 'Sports & Fitness' },
  Transportation: { key: 'transportation', name: 'Transportation' },
  Travel: { key: 'travel', name: 'Travel' },
};

const PARTS = Object.fromEntries(
  Object.values(DOMAIN_KEYS).map(({ key, name }) => [key, { name, group: 'Domain' }]),
);

const round2 = (v: number) => Math.round(v * 100) / 100;

const board: Leaderboard = {
  benchmark: 'drbench-pro',
  url: SITE,
  feed: FEED,
  terms: 'Public research benchmark leaderboard published by Zhejiang University and Tencent.',
  parts: PARTS,
  stats: {
    breadth: { name: 'Breadth', unit: '%', better: 'higher' },
    depth: { name: 'Depth', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [globalData, domainData] = await Promise.all([
      fetchJson<GlobalPayload>(FEED),
      fetchJson<DomainPayload>(DOMAIN_FEED),
    ]);
    if (!Array.isArray(globalData.results) || globalData.results.length === 0) {
      throw new Error('DRBench Pro results.json returned no entries');
    }

    const domainBySys = new Map<string, Record<string, number>>();
    for (const dom of domainData.domains ?? []) {
      const spec = DOMAIN_KEYS[dom.name];
      if (!spec) continue;
      for (const item of dom.results ?? []) {
        if (typeof item.overall_percent !== 'number' || !Number.isFinite(item.overall_percent)) continue;
        let bag = domainBySys.get(item.system_id);
        if (!bag) {
          bag = {};
          domainBySys.set(item.system_id, bag);
        }
        bag[spec.key] = round2(item.overall_percent);
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const s of globalData.results) {
      if (!s.name || typeof s.overall_percent !== 'number' || !Number.isFinite(s.overall_percent)) continue;
      const model = s.system_id === 'qwen3_8_max_native' ? 'Qwen3.8 Max' : s.name.trim();
      const metrics: Record<string, number> = {};
      if (typeof s.breadth_percent === 'number' && Number.isFinite(s.breadth_percent)) {
        metrics.breadth = round2(s.breadth_percent);
      }
      if (typeof s.depth_percent === 'number' && Number.isFinite(s.depth_percent)) {
        metrics.depth = round2(s.depth_percent);
      }
      const doms = domainBySys.get(s.system_id);
      if (doms) Object.assign(metrics, doms);

      const row: LeaderboardRow = {
        model,
        score: round2(s.overall_percent),
        metrics,
      };
      if (s.category) row.setting = s.category.trim();
      rows.push(row);
    }

    if (rows.length < 12) throw new Error(`DRBench Pro parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;

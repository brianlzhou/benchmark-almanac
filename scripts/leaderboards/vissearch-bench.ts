// VisSearch-Bench (Ant Group and Tsinghua University): 204 long-horizon visual search tasks across
// 7 knowledge domains and 5 visual search categories. Reads the live results.json served by the
// project website, capturing final accuracy (%), partial-credit process score (%), and all 12 domain
// and category accuracy breakdowns across Direct Answer, ReAct, and DeerFlow settings.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://dingwu1021.github.io/VisSearch-Bench/data/results.json';

interface VisSearchSlice {
  accuracy?: number;
  ps?: number;
}

interface VisSearchEntry {
  model: string;
  setting?: string;
  accuracy: number;
  ps?: number;
  domains?: Record<string, VisSearchSlice>;
  categories?: Record<string, VisSearchSlice>;
}

const DOMAIN_KEYS: readonly [string, string][] = [
  ['Culture, Arts & Entertainment', 'cultureArts'],
  ['Society, History & Public Affairs', 'societyHistory'],
  ['Geography & Built Environment', 'geographyBuilt'],
  ['Life Sciences & Health', 'lifeSciences'],
  ['Physical Sciences, Earth & Space', 'physicalSciences'],
  ['Technology, Engineering', 'techEngineering'],
  ['Business & Everyday Life', 'businessEveryday'],
];

const CATEGORY_KEYS: readonly [string, string][] = [
  ['Set-wise Visual Search', 'setWise'],
  ['Sequential Visual Search', 'sequential'],
  ['Hybrid Wide–Deep Search', 'hybridWideDeep'],
  ['Competitive Visual Disambiguation', 'competitiveDisambig'],
  ['Visual-Structure-Guided Search', 'visualStructure'],
];

const board: Leaderboard = {
  benchmark: 'vissearch-bench',
  url: 'https://dingwu1021.github.io/VisSearch-Bench/',
  feed: FEED,
  terms: 'Public research benchmark website published by Ant Group and Tsinghua University.',
  parts: {
    cultureArts: { name: 'Culture, Arts and Entertainment', group: 'Domain', unit: '%', better: 'higher' },
    societyHistory: { name: 'Society, History and Public Affairs', group: 'Domain', unit: '%', better: 'higher' },
    geographyBuilt: { name: 'Geography and Built Environment', group: 'Domain', unit: '%', better: 'higher' },
    lifeSciences: { name: 'Life Sciences and Health', group: 'Domain', unit: '%', better: 'higher' },
    physicalSciences: { name: 'Physical Sciences, Earth and Space', group: 'Domain', unit: '%', better: 'higher' },
    techEngineering: { name: 'Technology and Engineering', group: 'Domain', unit: '%', better: 'higher' },
    businessEveryday: { name: 'Business and Everyday Life', group: 'Domain', unit: '%', better: 'higher' },
    setWise: { name: 'Set-wise Visual Search', group: 'Category', unit: '%', better: 'higher' },
    sequential: { name: 'Sequential Visual Search', group: 'Category', unit: '%', better: 'higher' },
    hybridWideDeep: { name: 'Hybrid Wide-Deep Search', group: 'Category', unit: '%', better: 'higher' },
    competitiveDisambig: { name: 'Competitive Visual Disambiguation', group: 'Category', unit: '%', better: 'higher' },
    visualStructure: { name: 'Visual-Structure-Guided Search', group: 'Category', unit: '%', better: 'higher' },
  },
  stats: {
    processScore: { name: 'Process score', unit: '%', better: 'higher', note: 'Partial-credit score measuring intermediate visual search evidence steps.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const entries = JSON.parse(await fetchText(FEED)) as VisSearchEntry[];
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      if (!e.model || !Number.isFinite(e.accuracy)) continue;
      const metrics: Record<string, number> = {};
      if (typeof e.ps === 'number' && Number.isFinite(e.ps)) metrics.processScore = e.ps;
      for (const [src, k] of DOMAIN_KEYS) {
        const v = e.domains?.[src]?.accuracy;
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      for (const [src, k] of CATEGORY_KEYS) {
        const v = e.categories?.[src]?.accuracy;
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      rows.push({
        model: e.model.trim(),
        score: e.accuracy,
        ...(e.setting ? { setting: e.setting.trim() } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;

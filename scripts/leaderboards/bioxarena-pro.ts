// BioXArena-Pro (MBZUAI): 64 autonomous biomedical machine learning tasks across 8 domains.
// Reads the embedded `const summaries = [...]` JSON from the official GitHub Pages leaderboard (22 agent/backbone pairs).
// Headline score is Task Avg (mean_all * 100, failures scored as 0), matching the leaderboard table.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://mbzuai-ai4bio.github.io/BioXArena-Pro/';

interface BioSummary {
  scaffold: string;
  backbone: string;
  succeeded: number;
  mean_all: number;
  mean_succ: number;
  domains: Record<string, number>;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

const DOMAIN_MAP: Record<string, string> = {
  'chemical-biology': 'chemicalBiology',
  imaging: 'imaging',
  'network-biology': 'networkBiology',
  perturbation: 'perturbation',
  'phenotype-disease': 'phenotypeDisease',
  'sequence-genomics': 'sequenceGenomics',
  'single-cell-spatial': 'singleCellSpatial',
  structure: 'structure',
};

const board: Leaderboard = {
  benchmark: 'bioxarena-pro',
  url: PAGE,
  feed: PAGE,
  terms: 'Public leaderboard published on GitHub Pages by MBZUAI AI4Bio.',
  harnesses: 'system',
  parts: {
    chemicalBiology: { name: 'Chemical biology', group: 'Domain' },
    imaging: { name: 'Medical imaging', group: 'Domain' },
    networkBiology: { name: 'Network biology', group: 'Domain' },
    perturbation: { name: 'Perturbation', group: 'Domain' },
    phenotypeDisease: { name: 'Phenotype and disease', group: 'Domain' },
    sequenceGenomics: { name: 'Sequence genomics', group: 'Domain' },
    singleCellSpatial: { name: 'Single-cell and spatial', group: 'Domain' },
    structure: { name: 'Protein structure', group: 'Domain' },
  },
  stats: {
    succeeded: { name: 'Succeeded tasks', unit: 'count', better: 'higher', note: 'Tasks completed with a valid submission out of 64.' },
    meanSucc: { name: 'Success-only average', unit: 'score', better: 'higher', note: 'Mean normalized score (x100) over completed tasks only.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`BioXArena-Pro page: ${res.status}`);
    const html = await res.text();
    const m = html.match(/const\s+summaries\s*=\s*(\[[\s\S]*?\]);/);
    if (!m) throw new Error('BioXArena-Pro: summaries array not found');
    const summaries = JSON.parse(m[1]) as BioSummary[];

    const rows: LeaderboardRow[] = [];
    for (const s of summaries) {
      if (!s.backbone || typeof s.mean_all !== 'number') continue;
      const metrics: Record<string, number> = {
        succeeded: s.succeeded,
        meanSucc: r2(s.mean_succ * 100),
      };
      for (const [rawKey, partKey] of Object.entries(DOMAIN_MAP)) {
        const val = s.domains?.[rawKey];
        if (typeof val === 'number' && Number.isFinite(val)) {
          metrics[partKey] = r2(val * 100);
        }
      }
      rows.push({
        model: s.backbone,
        harness: s.scaffold,
        score: r2(s.mean_all * 100),
        metrics,
      });
    }
    if (rows.length === 0) throw new Error('BioXArena-Pro: parsed zero rows');
    return rows;
  },
};

export default board;

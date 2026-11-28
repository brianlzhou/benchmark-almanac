// LatchBio Capabilities v1.0 on benchmarks.bio. The site publishes /results/v1/latest.json for machine use
// (llms.txt): capabilitiesLeaderboard ranks model-and-harness pairs by overallScorePct, the weighted mean
// of the V1 benchmarks' macro-mean pass rates (0 to 100), which is the score. The harness (Pi, Claude
// Code, Codex, Grok Build) is kept. "Claude Opus 5.5*" rows are modelVariant LSVP, Anthropic's
// safety-filter-exempt variant, reported next to the standard run; the asterisk is dropped and the variant
// becomes the setting. The feed identifies the included benchmarks and the coverage of each score. Legacy V0 (/results/v0/) is a different, non-comparable series and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://benchmarks.bio/results/v1/latest.json';

interface Row {
  model: string;
  harness?: string;
  overallScorePct?: number;
  modelVariant?: string | null;
  benchmarkCoverage?: string;
  scores?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'latchbio-capabilities-v1-0',
  harnesses: 'system',
  reference: ['Pi'],
  url: 'https://benchmarks.bio/results/v1/',
  feed: `${FEED} (capabilitiesLeaderboard)`,
  terms: 'JSON that benchmarks.bio publishes for machine use (llms.txt); robots.txt allows all paths and the site states no license.',
  stats: {
    benchmarksCovered: { name: 'Benchmarks covered', unit: 'count' },
  },
  parts: {
    spatialbench: { name: 'SpatialBench', group: 'Multiomics' },
    'spatialbench-long': { name: 'SpatialBench-Long', group: 'Multiomics' },
    scbench: { name: 'scBench', group: 'Multiomics' },
    'scbench-long': { name: 'scBench-Long', group: 'Multiomics' },
    epibench: { name: 'EpiBench', group: 'Multiomics' },
    variantbench: { name: 'VariantBench', group: 'Multiomics' },
    metagenomics: { name: 'MetagenomicsBench', group: 'Multiomics' },
    'txbench-ab': { name: 'TxBench-Antibody-Discovery', group: 'Therapeutics' },
    'txbench-pp': { name: 'TxBench-Preclinical-Pharmacology', group: 'Therapeutics' },
    'txbench-od': { name: 'TxBench-Oligo-Discovery', group: 'Therapeutics' },
    'txbench-abdev': { name: 'TxBench-Antibody-Development', group: 'Therapeutics' },
    'biosecbench-surveillance': { name: 'BioSecBench-Surveillance', group: 'Biosecurity' },
    functionbench: { name: 'BioSecBench-Function', group: 'Biosecurity' },
    'biosecbench-respvirus-surveillance': { name: 'BioSecBench-RespiratoryVirus-Surveillance', group: 'Biosecurity' },
    'biosecbench-respvirus-countermeasures': { name: 'BioSecBench-RespiratoryVirus-Countermeasures', group: 'Biosecurity' },
    'biosecbench-refusal': { name: 'BioSecBench-Refusal', group: 'Biosecurity' },
    'biosecbench-structure': { name: 'BioSecBench-Structure', group: 'Biosecurity' },
    oncologybench: { name: 'OncologyBench', group: 'Applications' },
    rarediseasebench: { name: 'RareDiseaseBench', group: 'Applications' },
    tissuemicroscopybench: { name: 'TissueMicroscopyBench', group: 'Bioscience' },
    cellmicroscopybench: { name: 'CellMicroscopyBench', group: 'Bioscience' },
    neurosciencebench: { name: 'NeuroscienceBench', group: 'Bioscience' },
  },
  aliases: {
    // the only Nemotron 3 Ultra in the registry (550B total, 55B active)
    'Nemotron 3 Ultra 550B A55B': 'nemotron-3-ultra',
  },
  async fetch() {
    const data = await fetchJson<{ resultVersion?: string; benchmarks: {id: string; label: string; category: string; assessment: string; excludeFromOverall: boolean}[]; capabilitiesLeaderboard: Row[] }>(FEED);
    if (data.resultVersion && data.resultVersion !== 'v1') throw new Error(`unexpected result version ${data.resultVersion}`);
    const rows: LeaderboardRow[] = [];
    for (const r of data.capabilitiesLeaderboard) {
      if (typeof r.overallScorePct !== 'number') continue;
      const metrics = Object.fromEntries(Object.entries(r.scores ?? {}).filter(([, value]) => Number.isFinite(value)));
      const coverage = r.benchmarkCoverage?.match(/^(\d+)\/(\d+)$/);
      if (coverage) {
        metrics.benchmarksCovered = Number(coverage[1]);
      }
      rows.push({
        model: r.model.replace(/\*+$/, '').trim(),
        score: r.overallScorePct,
        harness: r.harness || undefined,
        setting: r.modelVariant || undefined,
        metrics,
      });
    }
    return rows;
  },
};
export default board;

// PhysCapBench (Peking University, Tsinghua University, Beihang University and collaborators).
// Cross-domain benchmark for physically grounded video captioning across seven physical dimensions.
// Reads results.json published directly on the official leaderboard site (hfwang2001.github.io/PhysCapBench).
// Because the source evaluates Third-person and Egocentric splits separately without a cross-domain overall
// average, the headline score is the Third-person overall score (0 to 100, the first and largest split in
// results.json), with all seven Third-person dimensions plus Egocentric overall and dimensions in parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://hfwang2001.github.io/PhysCapBench/results.json';

interface Entry {
  rank: number;
  strategy: string;
  overall: number;
  dimensions: Record<string, number>;
}
interface Payload {
  version?: string;
  dimension_labels: Record<string, string>;
  domains: {
    third?: { label: string; results: Entry[] };
    ego?: { label: string; results: Entry[] };
  };
}

const board: Leaderboard = {
  benchmark: 'physcapbench',
  url: 'https://hfwang2001.github.io/PhysCapBench/',
  feed: FEED,
  terms: 'Public report-snapshot leaderboard JSON in hfwang2001/PhysCapBench. https://github.com/hfwang2001/PhysCapBench',
  headline: 'The leaderboard scores Third-person and Egocentric domains separately, so this is the Third-person overall score (the largest split), with Egocentric and all seven physical dimensions in parts.',
  parts: {
    event_coverage: { name: 'Event coverage', group: 'Third-person dimensions' },
    object_role: { name: 'Objects and roles', group: 'Third-person dimensions' },
    action_motion: { name: 'Actions and motion', group: 'Third-person dimensions' },
    contact_interaction: { name: 'Contact and interaction', group: 'Third-person dimensions' },
    state_spatial_outcome: { name: 'States and outcomes', group: 'Third-person dimensions' },
    mechanism_causality: { name: 'Physical mechanisms and causality', group: 'Third-person dimensions' },
    temporal_order: { name: 'Temporal order', group: 'Third-person dimensions' },
    ego_overall: { name: 'Egocentric overall', group: 'Egocentric' },
    ego_event_coverage: { name: 'Egocentric: Event coverage', group: 'Egocentric' },
    ego_object_role: { name: 'Egocentric: Objects and roles', group: 'Egocentric' },
    ego_action_motion: { name: 'Egocentric: Actions and motion', group: 'Egocentric' },
    ego_contact_interaction: { name: 'Egocentric: Contact and interaction', group: 'Egocentric' },
    ego_state_spatial_outcome: { name: 'Egocentric: States and outcomes', group: 'Egocentric' },
    ego_mechanism_causality: { name: 'Egocentric: Physical mechanisms and causality', group: 'Egocentric' },
    ego_temporal_order: { name: 'Egocentric: Temporal order', group: 'Egocentric' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<Payload>(FEED);
    const third = data.domains?.third?.results;
    if (!Array.isArray(third) || third.length < 5) throw new Error('PhysCapBench Third-person results missing');

    const egoByStrategy = new Map<string, Entry>();
    for (const e of data.domains?.ego?.results ?? []) egoByStrategy.set(e.strategy, e);

    const dateMatch = data.version?.match(/(\d{4})(\d{2})(\d{2})/);
    const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : undefined;

    const rows: LeaderboardRow[] = third.map((e) => {
      if (!e.strategy || !Number.isFinite(e.overall)) throw new Error('Invalid PhysCapBench row');
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(e.dimensions ?? {})) {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
      }
      const ego = egoByStrategy.get(e.strategy);
      if (ego && Number.isFinite(ego.overall)) {
        metrics.ego_overall = ego.overall;
        for (const [k, v] of Object.entries(ego.dimensions ?? {})) {
          if (typeof v === 'number' && Number.isFinite(v)) metrics[`ego_${k}`] = v;
        }
      }
      return {
        model: e.strategy,
        score: e.overall,
        setting: 'Third-person',
        date,
        metrics,
      };
    });
    return checked(rows, 11);
  },
};

export default board;

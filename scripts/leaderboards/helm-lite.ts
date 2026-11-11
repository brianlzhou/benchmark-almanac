// HELM Lite (Stanford CRFM). The board's headline is "Mean win rate" in the Accuracy table of core_scenarios.json:
// the share of other models each model beats, averaged over the ten scenarios. It is relative to the models on
// the board, times 100. Read through helmRows in helm-capabilities.ts.
import { fetchJson } from '../lib/util.ts';
import type { Leaderboard } from './types.ts';
import { HELM_BUCKET, helmNewest, HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'lite', group: 'core_scenarios', table: 'Accuracy', column: 'Mean win rate', scale: 100 };

const board: Leaderboard = {
  benchmark: 'helm-lite',
  url: 'https://crfm.stanford.edu/helm/lite/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  async fetch() {
    const rows = await helmRows(TABLE);
    const newest = await helmNewest('lite');
    const tables = await fetchJson<any[]>(`${HELM_BUCKET}/${newest}groups/core_scenarios.json`);
    const accuracy = tables.find(t => t.title === 'Accuracy');
    const scoreIndex = accuracy?.header.findIndex((h: any) => h.value === 'Mean win rate');
    const source = accuracy?.rows.filter((r: any) => typeof r[scoreIndex]?.value === 'number');
    if (!source || source.length !== rows.length) throw new Error('HELM Lite changed during resource join');
    const general = tables.find(t => t.title === 'General information');
    for (let i = 0; i < rows.length; i++) {
      if (Math.abs(source[i][scoreIndex].value * 100 - rows[i].score) > 1e-8) throw new Error('HELM Lite score join mismatch');
      const resource = general?.rows.find((r: any) => r[0]?.value === source[i][0]?.value);
      const metrics: Record<string, number> = {};
      general?.header.forEach((h: any, j: number) => {
        if (/ - # (?:prompt|output) tokens$/.test(h.value) && typeof resource?.[j]?.value === 'number') metrics[h.value] = resource[j].value;
      });
      // These are scenario-specific request counts. No unpublished whole-benchmark average is invented.
      rows[i].metrics = {...rows[i].metrics, ...metrics};
    }
    return rows;
  },
};
export default board;

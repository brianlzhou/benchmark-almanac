// Artificial Analysis's Intelligence Index as a second way to rank models, next to Epoch AI's Capabilities Index.
// The numbers come from Artificial Analysis's API (scripts/leaderboards/artificial-analysis-intelligence-index.ts),
// which it allowed on November 19, 2026. A model's number is its best across the settings Artificial Analysis ran
// it at. Every view that shows them credits Artificial Analysis with a link, as its API terms require.
import { leaderboardScores, benchById, bestPerModel, modelById } from './data.ts';

export const AA_INDEX_ID = 'artificial-analysis-intelligence-index';
export const AA_NAME = 'Artificial Analysis Intelligence Index';
export const AA_SITE = 'https://artificialanalysis.ai/';

const b = benchById.get(AA_INDEX_ID);
const best = b ? bestPerModel(leaderboardScores.filter((s) => s.benchmark === AA_INDEX_ID && modelById.has(s.model)), b) : [];

/** Each model's best Intelligence Index score, and the setting it came from. */
export const aaByModel = new Map(best.map((s) => [s.model, { value: s.value, setting: s.setting ?? undefined }]));
/** Models by Intelligence Index, highest first. */
export const aaOrder: string[] = best.map((s) => s.model);
/** Every model's score, lowest first, for the strip that places one among the rest. */
export const aaValues: number[] = best.map((s) => s.value).sort((x, y) => x - y);
export const aaRank = (id: string): number | undefined => {
  const i = aaOrder.indexOf(id);
  return i >= 0 ? i + 1 : undefined;
};
/** Enough models to rank a page by it. */
export const aaReady = aaOrder.length >= 6;

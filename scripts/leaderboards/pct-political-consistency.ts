// PCT (Polarized Contrastive Pairs) on the CAIS AI Dashboard. The dashboard's PCT column is political
// inconsistency (lower is better): the mean of sentiment inconsistency and helpfulness inconsistency
// (pct_detail), stored as scores.pct in the page's model data. That number is the score. The reader is shared
// with cais-text-capabilities-index.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { CAIS_ALIASES, CAIS_PAGE, CAIS_TERMS, caisModels, type CaisModel } from './cais-text-capabilities-index.ts';

type PctModel = CaisModel & {
  pct_detail?: { sentiment_inconsistency?: number; helpfulness_inconsistency?: number };
};

const EFFORT = /-(minimal|low|medium|high|xhigh|max)$/;

const board: Leaderboard = {
  benchmark: 'pct-political-consistency',
  url: CAIS_PAGE,
  feed: `${CAIS_PAGE} (page JS chunk, scores.pct, political inconsistency)`,
  terms: CAIS_TERMS,
  parts: {
    sentimentInconsistency: { name: 'Sentiment inconsistency', unit: '%' },
    helpfulnessInconsistency: { name: 'Helpfulness inconsistency', unit: '%' },
  },
  aliases: CAIS_ALIASES,
  async fetch(): Promise<LeaderboardRow[]> {
    const models = (await caisModels()) as PctModel[];
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const score = m.scores.pct;
      if (typeof score !== 'number') continue;
      const setting = m.id.match(EFFORT)?.[1] ?? (/-thinking/.test(m.id) ? 'thinking' : undefined);
      const metrics: Record<string, number> = {};
      if (typeof m.pct_detail?.sentiment_inconsistency === 'number') metrics.sentimentInconsistency = m.pct_detail.sentiment_inconsistency;
      if (typeof m.pct_detail?.helpfulness_inconsistency === 'number') metrics.helpfulnessInconsistency = m.pct_detail.helpfulness_inconsistency;
      rows.push({
        model: m.name,
        score: Number(score.toFixed(1)),
        setting,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no pct scores in CAIS dashboard data');
    return rows;
  },
};
export default board;

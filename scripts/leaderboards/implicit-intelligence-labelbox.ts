// Labelbox ranks models by scenario pass rate on implicit instructions. The embedded model rows contain confidence intervals and four scenario categories.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/implicit-intelligence/";

const board: Leaderboard = {
  benchmark: "implicit-intelligence-labelbox",
  url: "https://labelbox.com/leaderboards/implicit-intelligence/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service Its robots.txt restrictions cover CGI and PDF paths.",
  parts: { implicit_reasoning: 'Implicit Reasoning', catastrophic_risk: 'Catastrophic Risk', privacy_security: 'Privacy & Security', accessibility: 'Accessibility' },
  stats: { nss: { name: 'Normalized scenario score', unit: 'score', better: 'higher' }, steps: { name: 'Steps', unit: 'count' } },
  async fetch() {
    type Entry = Record<string, unknown> & { label: string; variant?: string; spr: number; spr_ci: number; nss: number; nss_ci: number; steps: number };
    const entries: Entry[] = (await labelboxData(feed, 'implicit-intelligence')).models;
    if (entries.length < 30) throw new Error('Missing implicit intelligence models');
    return entries.map(r => {
      if (!r.label || ![r.spr, r.spr_ci, r.nss, r.nss_ci, r.steps].every(Number.isFinite)) throw new Error('Invalid implicit intelligence row');
      const metrics: Record<string, number> = { nss: r.nss, nssLow: r.nss - r.nss_ci, nssHigh: r.nss + r.nss_ci, steps: r.steps };
      for (const key of Object.keys(board.parts!)) {
        if (typeof r[key] !== 'number') throw new Error('Missing category: ' + key);
        metrics[key] = r[key];
      }
      return { model: r.label, setting: r.variant ?? undefined, score: r.spr, low: r.spr - r.spr_ci, high: r.spr + r.spr_ci, metrics };
    });
  },
};

export default board;

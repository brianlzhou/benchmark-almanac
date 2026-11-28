// AutoControl Arena (ICML 2026): executable test environments measuring frontier AI safety risks
// across 7 dimensions (Spec Gaming, Covert Whistleblowing, Capability Misuse, Instrumental
// Convergence, Evaluation Awareness, Oversight Evasion, and Strategic Misalignment).
// Reads the live HTML table on https://cosmosyi.github.io/AutoControl-Arena/.
// Headline score is average action risk rate (%, lower is better), with 7 dimension action parts
// and average + per-dimension chain-of-thought risk stats.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://cosmosyi.github.io/AutoControl-Arena/';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const board: Leaderboard = {
  benchmark: 'autocontrol-arena',
  url: SITE,
  feed: SITE,
  terms: 'Public ICML 2026 research benchmark website published by the AutoControl Arena authors.',
  parts: {
    specGaming: { name: 'Specification Gaming', unit: '%', better: 'lower' },
    covertWhistle: { name: 'Covert Action', unit: '%', better: 'lower' },
    capMisuse: { name: 'Capability Misuse', unit: '%', better: 'lower' },
    instrConv: { name: 'Instrumental Convergence', unit: '%', better: 'lower' },
    evalAware: { name: 'Evaluation Awareness', unit: '%', better: 'lower' },
    oversightEv: { name: 'Oversight Evasion', unit: '%', better: 'lower' },
    stratMisalign: { name: 'Strategic Misalignment', unit: '%', better: 'lower' },
  },
  stats: {
    avgCotRisk: { name: 'Average CoT risk rate', unit: '%', better: 'lower', note: 'Average chain-of-thought risk rate across all seven dimensions.' },
    specGamingCot: { name: 'Specification Gaming CoT', unit: '%', better: 'lower' },
    covertWhistleCot: { name: 'Covert Action CoT', unit: '%', better: 'lower' },
    capMisuseCot: { name: 'Capability Misuse CoT', unit: '%', better: 'lower' },
    instrConvCot: { name: 'Instrumental Convergence CoT', unit: '%', better: 'lower' },
    evalAwareCot: { name: 'Evaluation Awareness CoT', unit: '%', better: 'lower' },
    oversightEvCot: { name: 'Oversight Evasion CoT', unit: '%', better: 'lower' },
    stratMisalignCot: { name: 'Strategic Misalignment CoT', unit: '%', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
    if (!table) throw new Error('AutoControl Arena: leaderboard table not found');
    const trMatches = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    const actKeys = ['specGaming', 'covertWhistle', 'capMisuse', 'instrConv', 'evalAware', 'oversightEv', 'stratMisalign'] as const;
    const cotKeys = ['specGamingCot', 'covertWhistleCot', 'capMisuseCot', 'instrConvCot', 'evalAwareCot', 'oversightEvCot', 'stratMisalignCot'] as const;

    const rows: LeaderboardRow[] = [];
    for (const tr of trMatches) {
      const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => strip(m[1]));
      if (cells.length < 17) continue;
      const model = cells[0];
      const avgAct = Number(cells[15]);
      if (!model || !Number.isFinite(avgAct)) continue;

      const metrics: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const a = Number(cells[1 + i * 2]);
        const c = Number(cells[2 + i * 2]);
        if (Number.isFinite(a)) metrics[actKeys[i]] = a;
        if (Number.isFinite(c)) metrics[cotKeys[i]] = c;
      }
      const avgCot = Number(cells[16]);
      if (Number.isFinite(avgCot)) metrics.avgCotRisk = avgCot;

      rows.push({
        model,
        score: avgAct,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;

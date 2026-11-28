// Vals AI's SEC claim verification study tests 400 claims for support, contradiction and citation errors.
// The headline score is overall claim accuracy, with five claim-category accuracies and cost per 1,000 claims as metrics.
// This importer reads the claims JSON embedded in the study's published JavaScript asset. The asset's name changes with
// each site build, so the importer finds it through the page's chart components, which import it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.vals.ai/blogs/independent-evaluation-of-jev';
/** The study data module, found through the page's chart components (each imports it under a hashed name). */
async function studySource(): Promise<string> {
  const html = await fetchText(PAGE);
  const components = [...new Set([...html.matchAll(/component-url="(\/_astro\/Jev\w+\.[\w-]+\.js)[^"]*"/g)].map((m) => m[1]))];
  for (const path of components) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const module = await fetchText(new URL(path, PAGE).href);
    const study = module.match(/from"\.\/(jevStudy\.[\w-]+\.js)/)?.[1];
    if (study) return fetchText(new URL(`/_astro/${study}`, PAGE).href);
  }
  throw new Error('Vals SEC study module not found in the page components');
}
const board: Leaderboard = {
  benchmark: 'vals-sec-claim-verification-400',
  url: PAGE,
  feed: `${PAGE} (claims accuracyVsCost data in the study's jevStudy module)`,
  terms: 'Vals AI reserves all rights on its public study page. The page gives no separate score-data license, and its robots.txt allows the page.',
  aliases: {
    'GPT-5.4 mini': 'gpt-5-4-mini',
    'DeepSeek V4.1 Flash': 'deepseek-v4-1-flash',
  },
  parts: {
    direct_support: { name: 'Direct support', group: 'Claim category' },
    subtle_contradiction: { name: 'Subtle contradiction', group: 'Claim category' },
    numeric_discrepancy: { name: 'Numeric discrepancy', group: 'Claim category' },
    missing_evidence: { name: 'Missing evidence', group: 'Claim category' },
    non_supporting_citation: { name: 'Non-supporting citation', group: 'Claim category' },
  },
  chart: {
    title: 'Accuracy against cost',
    x: { key: 'costPer1k', label: 'Cost per 1,000 claims', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Accuracy', unit: '%', better: 'higher' },
    note: 'The study compares accuracy on 400 claims with the cost of evaluating 1,000 claims.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = await studySource();
    const systems = new Map<string, string>();
    for (const match of source.matchAll(/\{key:`([^`]+)`,label:`([^`]+)`,company:`([^`]+)`\}/g)) systems.set(match[1], match[2]);
    const match = source.match(/claims:JSON\.parse\(`([\s\S]*?)`\)/);
    if (!match) throw new Error('Vals SEC claims data missing');
    const claims = JSON.parse(match[1]) as { accuracyVsCost?: Array<{ system?: string; accuracy?: number; costPer1k?: number; byCategory?: Record<string, { accuracy?: number }> }> };
    if (!claims.accuracyVsCost || claims.accuracyVsCost.length < 12) throw new Error('Vals SEC accuracy rows missing');
    return claims.accuracyVsCost.map((entry) => {
      const model = systems.get(entry.system ?? '');
      if (!model || typeof entry.accuracy !== 'number' || typeof entry.costPer1k !== 'number') throw new Error('Vals SEC row is incomplete');
      const metrics: Record<string, number> = { costPer1k: entry.costPer1k };
      for (const key of Object.keys(board.parts ?? {})) {
        const value = entry.byCategory?.[key]?.accuracy;
        if (typeof value === 'number' && Number.isFinite(value)) metrics[key] = value * 100;
      }
      return { model, score: entry.accuracy * 100, date: '2026-10-06', cost: entry.costPer1k / 1000, metrics };
    });
  },
};
export default board;

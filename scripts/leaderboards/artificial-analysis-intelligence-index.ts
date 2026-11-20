// Artificial Analysis Intelligence Index: Artificial Analysis's composite of nine evaluations it runs itself, read
// from its free Data API (/api/v2/language/models/free). Artificial Analysis allowed the almanac to show its index
// numbers on November 19, 2026, so only the composites come in: the Intelligence Index and the six Capability
// Indexes. Its individual evaluation results, prices and speeds stay out. Its API terms require a visible credit
// with a link, which the board's page and every index view carry.
//
// The key comes from AA_API_KEY, or from private/.env when run on this Mac. It is sent only to
// artificialanalysis.ai, in the x-api-key header, and never printed. A response from another index version fails,
// so a version 6 never lands on the version 5 record.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, ROOT } from '../lib/util.ts';

const API = 'https://artificialanalysis.ai/api/v2/language/models/free';
const VERSION = 5;
// the Capability Indexes: each a composite of the Intelligence Index evaluations for one kind of work
const CAPABILITY: [string, string, string][] = [
  ['artificial_analysis_finance_and_accounting_index', 'financeAccounting', 'Finance and accounting'],
  ['artificial_analysis_strategy_and_ops_index', 'strategyOps', 'Strategy and operations'],
  ['artificial_analysis_legal_index', 'legal', 'Legal'],
  ['artificial_analysis_healthcare_and_medical_index', 'healthcareMedical', 'Healthcare and medical'],
  ['artificial_analysis_engineering_index', 'engineering', 'Engineering'],
  ['artificial_analysis_economics_index', 'economics', 'Economics'],
];

interface Model {
  name: string;
  slug?: string;
  evaluations?: Record<string, number | null>;
}
interface Page {
  intelligence_index_version?: number;
  pagination?: { page: number; has_more: boolean };
  data: Model[];
}

function apiKey(): string {
  if (process.env.AA_API_KEY) return process.env.AA_API_KEY.trim();
  try {
    const m = readFileSync(join(ROOT, 'private', '.env'), 'utf8').match(/^AA_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, '');
  } catch {
    // no private/.env on this machine
  }
  throw new Error('AA_API_KEY is not set: add it to private/.env or the environment');
}

const board: Leaderboard = {
  benchmark: 'artificial-analysis-intelligence-index',
  url: 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index',
  feed: `${API} (Artificial Analysis Data API, free tier: evaluations.artificial_analysis_intelligence_index and the six Capability Indexes)`,
  terms: 'Artificial Analysis allowed the almanac to show its index numbers on November 19, 2026. Only the composite indexes come in, not its individual evaluations, prices or speeds. Its API terms require a visible credit and a link to artificialanalysis.ai.',
  host: 'Artificial Analysis',
  parts: Object.fromEntries(
    CAPABILITY.map(([, k, name]) => [k, { name, group: 'Capability Index', note: `Artificial Analysis's ${name.toLowerCase()} index, built from the Intelligence Index evaluations that test this kind of work.`, unit: 'index' }]),
  ),
  async fetch() {
    const key = apiKey();
    const rows: LeaderboardRow[] = [];
    for (let page = 1; page <= 20; page++) {
      const d = JSON.parse(await fetchText(`${API}?page=${page}`, { headers: { 'x-api-key': key } })) as Page;
      if (d.intelligence_index_version !== undefined && d.intelligence_index_version !== VERSION)
        throw new Error(`Artificial Analysis reports Intelligence Index version ${d.intelligence_index_version}: add a record for it before reading it`);
      for (const m of d.data ?? []) {
        const v = m.evaluations?.artificial_analysis_intelligence_index;
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        const metrics: Record<string, number> = {};
        for (const [field, k] of CAPABILITY) {
          const x = m.evaluations?.[field];
          if (typeof x === 'number' && Number.isFinite(x)) metrics[k] = x;
        }
        // release_date is the model's release, not a run date, so it stays out: a matched row takes its release from
        // the model record
        rows.push({ model: m.name, score: v, ...(Object.keys(metrics).length ? { metrics } : {}) });
      }
      if (!d.pagination?.has_more) break;
      // two requests a day against a free quota of 100: no need to hurry
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (rows.length < 20) throw new Error(`Artificial Analysis Intelligence Index: ${rows.length} models, expected at least 20`);
    return rows;
  },
};
export default board;

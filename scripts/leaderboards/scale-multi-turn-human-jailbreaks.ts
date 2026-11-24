// Multi-Turn Human Jailbreaks (Scale MHJ) evaluates LLM safety defenses against 537 multi-turn
// human red-teaming conversations on HarmBench (n=240 behaviors). This importer reads Table 2
// (human multi-turn and automated attack success rates) and Table 3 (benign acceptance rate)
// of arXiv:2408.15221 across all four defended Llama-3-8B-Instruct models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2408.15221';

const DEFENSE_NAMES: Record<string, string> = {
  RR: 'Llama-3-8B-Instruct-RR',
  LAT: 'Llama-3-8B-Instruct-LAT',
  DERTA: 'Llama-3-8B-Instruct-DERTA',
  CYGNET: 'CYGNET',
};

const ATTACK_KEYS: ReadonlyArray<readonly [RegExp, string, string]> = [
  [/^Ensemble Automated Attack$/i, 'ensembleAutomated', 'Ensemble automated attack ASR'],
  [/^AutoDAN$/i, 'autoDan', 'AutoDAN ASR'],
  [/^AutoPrompt$/i, 'autoPrompt', 'AutoPrompt ASR'],
  [/^GCG$/i, 'gcg', 'GCG ASR'],
  [/^GPTFuzzer$/i, 'gptFuzzer', 'GPTFuzzer ASR'],
  [/^PAIR$/i, 'pair', 'PAIR ASR'],
  [/^ZeroShot$/i, 'zeroShot', 'Zero-shot automated ASR'],
];

function parsePct(cell: string): number | null {
  const cleaned = cell.replace(/[*†‡%]/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned === '—') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`Scale MHJ unexpected cell: "${cell}"`);
  return n;
}

const board: Leaderboard = {
  benchmark: 'scale-multi-turn-human-jailbreaks',
  static: 'paper',
  url: 'https://arxiv.org/abs/2408.15221',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is multi-turn human jailbreak attack success rate in percent on HarmBench from Table 2. Lower is better.',
  stats: {
    ...Object.fromEntries(ATTACK_KEYS.map(([, key, name]) => [key, { name, unit: '%' as const, better: 'lower' as const }])),
    acceptedRate: { name: 'Benign acceptance rate', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const t2 = tables.find((g) => /ASR by Attack/i.test(g[0]?.[0] ?? '') && g.some((r) => /Human \(Ours\)/i.test(r[0] ?? '')));
    const t3 = tables.find((g) => g[0]?.[0] === 'Defense' && /Accepted/i.test(g[0]?.[1] ?? ''));
    if (!t2 || !t3) throw new Error('Scale MHJ Table 2 or Table 3 missing');

    const headers = t2[0].slice(1).map((h) => h.replace(/[*†‡]/g, '').trim());
    const accepted = new Map<string, number>();
    for (const r of t3.slice(1)) {
      const def = r[0]?.replace(/[*†‡]/g, '').trim();
      const val = parsePct(r[1] ?? '');
      if (def && val !== null) accepted.set(def, val);
    }

    const humanRow = t2.find((r) => /Human \(Ours\)/i.test(r[0] ?? ''));
    if (!humanRow) throw new Error('Scale MHJ Human (Ours) row missing');

    const rows: LeaderboardRow[] = [];
    for (let i = 0; i < headers.length; i++) {
      const code = headers[i];
      const model = DEFENSE_NAMES[code] ?? code;
      const score = parsePct(humanRow[i + 1] ?? '');
      if (score === null) throw new Error(`Scale MHJ missing Human ASR for ${code}`);

      const metrics: Record<string, number> = {};
      for (const [re, key] of ATTACK_KEYS) {
        const atkRow = t2.find((r) => re.test((r[0] ?? '').trim()));
        const val = atkRow ? parsePct(atkRow[i + 1] ?? '') : null;
        if (val !== null) metrics[key] = val;
      }
      if (accepted.has(code)) metrics.acceptedRate = accepted.get(code)!;

      rows.push({ model, score, metrics });
    }

    return checked(rows, 4);
  },
};

export default board;

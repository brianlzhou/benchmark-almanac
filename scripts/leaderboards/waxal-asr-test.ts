// WAXAL ASR Test evaluates automatic speech recognition across 19 Sub-Saharan African languages
// on speaker-disjoint test splits. This importer reads Table 4 (WER) and Table 5 (CER) of
// arXiv:2602.02734, converting decimal WER and CER proportions to percentages (lower is better),
// with 95% confidence intervals on fine-tuned macro-averages and per-language WER parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2602.02734';

const LANGS: ReadonlyArray<readonly [string, string]> = [
  ['ach', 'Acholi'],
  ['aka', 'Akan'],
  ['amh', 'Amharic'],
  ['dag', 'Dagbani'],
  ['dga', 'Dagaare'],
  ['ewe', 'Ewe'],
  ['ful', 'Fula'],
  ['kpo', 'Ikposo'],
  ['lin', 'Lingala'],
  ['lug', 'Luganda'],
  ['mas', 'Masaaba'],
  ['mlg', 'Malagasy'],
  ['nyn', 'Runyankole'],
  ['orm', 'Oromo'],
  ['sna', 'Shona'],
  ['sid', 'Sidama'],
  ['sog', 'Soga'],
  ['tir', 'Tigrinya'],
  ['wal', 'Wolaytta'],
];

function parseVal(cell: string): { mean: number; ci?: number } | null {
  const s = cell.replace(/[‡†⋆*]/g, '').trim();
  if (!s || s === '—' || s === '-') return null;
  const pm = s.match(/^(\d+(?:\.\d+)?)\s*(?:\\pm|±)\s*(\d+(?:\.\d+)?)$/);
  if (pm) return { mean: Number(pm[1]), ci: Number(pm[2]) };
  if (/^\d+(?:\.\d+)?$/.test(s)) return { mean: Number(s) };
  throw new Error(`WAXAL unexpected WER/CER cell: "${cell}"`);
}

const pct = (v: number) => Number((v * 100).toFixed(2));

const board: Leaderboard = {
  benchmark: 'waxal-asr-test',
  static: 'paper',
  url: 'https://arxiv.org/abs/2602.02734',
  feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt, and the paper tables are attributed to their authors.',
  headline: 'Headline is macro-average word error rate in percent across the 19 WAXAL ASR test languages from Table 4. Lower is better.',
  parts: Object.fromEntries(
    LANGS.map(([iso, name]) => [iso, { name, group: 'Language', unit: '%' as const, better: 'lower' as const }])
  ),
  stats: {
    cer: { name: 'Macro-average CER', unit: '%', better: 'lower' },
    runs: { name: 'Fine-tuned runs', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const werTable = tables.find((g) => g[0]?.[2] === 'Gemma-3n-E2B-it' && g[1]?.[0] === 'Language' && g[1]?.[2] === 'Zero-Shot');
    const cerTable = tables.find((g) => g[0]?.[2] === 'Gemma-3n-E2B-it' && g[1]?.[0] === 'Language' && g[1]?.[2] === 'ZS');
    if (!werTable || !cerTable) throw new Error('WAXAL WER or CER table missing');

    const models: ReadonlyArray<{ model: string; werZs: number; werFt: number; cerZs: number; cerFt: number; cerN: number }> = [
      { model: 'Gemma-3n-E2B-it', werZs: 2, werFt: 3, cerZs: 2, cerFt: 3, cerN: 4 },
      { model: 'Whisper-large-v3', werZs: 4, werFt: 5, cerZs: 5, cerFt: 6, cerN: 7 },
      { model: 'MMS-1B-all', werZs: 6, werFt: 7, cerZs: 8, cerFt: 9, cerN: 10 },
    ];

    const werAvgRow = werTable.find((r) => /^Macro-Average$/i.test(r[0]?.trim() ?? ''));
    const cerAvgRow = cerTable.find((r) => /^Macro-Average$/i.test(r[0]?.trim() ?? ''));
    if (!werAvgRow || !cerAvgRow) throw new Error('WAXAL Macro-Average row missing');

    const rows: LeaderboardRow[] = [];
    for (const cfg of models) {
      for (const setting of ['Zero-shot', 'Fine-tuned'] as const) {
        const werCol = setting === 'Zero-shot' ? cfg.werZs : cfg.werFt;
        const cerCol = setting === 'Zero-shot' ? cfg.cerZs : cfg.cerFt;
        const avgWer = parseVal(werAvgRow[werCol] ?? '');
        const avgCer = parseVal(cerAvgRow[cerCol] ?? '');
        if (!avgWer) throw new Error(`WAXAL missing macro-average WER for ${cfg.model} (${setting})`);

        const metrics: Record<string, number> = {};
        if (avgCer) metrics.cer = pct(avgCer.mean);
        if (setting === 'Fine-tuned') {
          const n = Number(cerAvgRow[cfg.cerN]?.trim());
          if (Number.isFinite(n)) metrics.runs = n;
        }

        for (const [iso] of LANGS) {
          const lRow = werTable.find((r) => r[1]?.trim() === iso);
          const v = lRow ? parseVal(lRow[werCol] ?? '') : null;
          if (v) metrics[iso] = pct(v.mean);
        }

        rows.push({
          model: cfg.model,
          setting,
          score: pct(avgWer.mean),
          ...(avgWer.ci !== undefined ? { low: pct(avgWer.mean - avgWer.ci), high: pct(avgWer.mean + avgWer.ci) } : {}),
          metrics,
        });
      }
    }

    return checked(rows, 6);
  },
};

export default board;

// SEA-HELM Audio results from arXiv:2610.19869 HTML Tables 2 and 3.
// Aggregates the six task-language Speech accuracy columns (Global-MMLU-Lite Chinese/English and
// SEA-HELM IFEval English/Indonesian/Malay/Tamil) into one row per evaluated ASR+LLM system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2610.19869';

const TASK_KEYS: Record<string, string> = {
  'mmlu|Chinese': 'mmluChinese',
  'mmlu|English': 'mmluEnglish',
  'ifeval|English': 'ifevalEnglish',
  'ifeval|Indonesian': 'ifevalIndonesian',
  'ifeval|Malay': 'ifevalMalay',
  'ifeval|Tamil': 'ifevalTamil',
};

const pctUp = { unit: '%' as const, better: 'higher' as const };
const pctDown = { unit: '%' as const, better: 'lower' as const };

const board: Leaderboard = {
  benchmark: 'sea-helm-audio',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: 'The authors publish these tables under the license on the arXiv record. https://arxiv.org/abs/2610.19869',
  harnesses: 'system',
  headline: 'Mean Speech accuracy across the six Global-MMLU-Lite and SEA-HELM IFEval language splits. Text baselines and text-to-speech accuracy gaps are kept as stats.',
  parts: {
    mmluChinese: { name: 'Chinese', group: 'Global-MMLU-Lite' },
    mmluEnglish: { name: 'English', group: 'Global-MMLU-Lite' },
    ifevalEnglish: { name: 'English', group: 'SEA-HELM IFEval' },
    ifevalIndonesian: { name: 'Indonesian', group: 'SEA-HELM IFEval' },
    ifevalMalay: { name: 'Malay', group: 'SEA-HELM IFEval' },
    ifevalTamil: { name: 'Tamil', group: 'SEA-HELM IFEval' },
  },
  stats: {
    mmluChineseText: { name: 'Global-MMLU-Lite Chinese text accuracy', ...pctUp },
    mmluChineseGap: { name: 'Global-MMLU-Lite Chinese text-to-speech gap', ...pctDown },
    mmluEnglishText: { name: 'Global-MMLU-Lite English text accuracy', ...pctUp },
    mmluEnglishGap: { name: 'Global-MMLU-Lite English text-to-speech gap', ...pctDown },
    ifevalEnglishText: { name: 'SEA-HELM IFEval English text accuracy', ...pctUp },
    ifevalEnglishGap: { name: 'SEA-HELM IFEval English text-to-speech gap', ...pctDown },
    ifevalIndonesianText: { name: 'SEA-HELM IFEval Indonesian text accuracy', ...pctUp },
    ifevalIndonesianGap: { name: 'SEA-HELM IFEval Indonesian text-to-speech gap', ...pctDown },
    ifevalMalayText: { name: 'SEA-HELM IFEval Malay text accuracy', ...pctUp },
    ifevalMalayGap: { name: 'SEA-HELM IFEval Malay text-to-speech gap', ...pctDown },
    ifevalTamilText: { name: 'SEA-HELM IFEval Tamil text accuracy', ...pctUp },
    ifevalTamilGap: { name: 'SEA-HELM IFEval Tamil text-to-speech gap', ...pctDown },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const tMmlu = tables[2];
    const tIfeval = tables[3];
    if (!tMmlu || !tIfeval) throw new Error('SEA-HELM Audio results tables missing');

    const byLlm = new Map<string, { asrs: Set<string>; speech: number[]; metrics: Record<string, number> }>();
    const ingest = (table: string[][], kind: 'mmlu' | 'ifeval') => {
      for (const r of table.slice(1)) {
        const lang = r[0]?.trim();
        const asr = r[1]?.trim();
        const llm = r[2]?.trim();
        const key = TASK_KEYS[`${kind}|${lang}`];
        const speech = Number(r[3]);
        const txt = Number(r[4]);
        const gap = Number(r[5]);
        if (!key || !llm || !asr || !Number.isFinite(speech)) continue;

        let bucket = byLlm.get(llm);
        if (!bucket) {
          bucket = { asrs: new Set(), speech: [], metrics: {} };
          byLlm.set(llm, bucket);
        }
        bucket.asrs.add(asr);
        bucket.speech.push(speech);
        bucket.metrics[key] = speech;
        if (Number.isFinite(txt)) bucket.metrics[`${key}Text`] = txt;
        if (Number.isFinite(gap)) bucket.metrics[`${key}Gap`] = gap;
      }
    };

    ingest(tMmlu, 'mmlu');
    ingest(tIfeval, 'ifeval');

    const rows: LeaderboardRow[] = [];
    for (const [llm, bucket] of byLlm) {
      if (bucket.speech.length !== 6) continue;
      const isCommercial = /Gemini/i.test(llm);
      const harness = isCommercial ? 'Commercial Stack' : 'Regional Open-Weight Baseline';
      const score = Number((bucket.speech.reduce((a, b) => a + b, 0) / bucket.speech.length).toFixed(2));
      rows.push({
        model: llm,
        harness,
        models: [llm, ...bucket.asrs],
        score,
        metrics: bucket.metrics,
      });
    }

    return checked(rows, 2);
  },
};

export default board;

// CLEVA evaluates Chinese language models. HELM’s Accuracy table ranks them by mean win rate across scenarios, on its published zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://storage.googleapis.com/crfm-helm-public/cleva/benchmark_output/releases/v1.0.0/groups/cleva_scenarios.json";
interface Table { title: string; header: {value: string}[]; rows: {value: string | number | null}[][] }
const clevaSubjects = ['Classical Chinese understanding','Commonsense reasoning','Coreference resolution','Cultural knowledge','Mathematical calculation','Mathematical reasoning','Paraphrase generation','Paraphrase identification','Pinyin transliteration','Reading comprehension','Sentiment analysis','Summarization','Text classification','Toxicity detection','Translation'];
const clevaCalibrated = ['Classical Chinese understanding','Commonsense reasoning','Coreference resolution','Cultural knowledge','Mathematical calculation','Paraphrase identification','Reading comprehension','Sentiment analysis','Text classification','Toxicity detection'];
const clevaFixedOut = new Set(['Commonsense reasoning','Coreference resolution','Paraphrase identification','Text classification','Toxicity detection']);
const clevaVaryTrunc = new Set(['Reading comprehension','Summarization']);
const clevaStats = Object.fromEntries([
  ...clevaSubjects.flatMap((subject) => [
    [`General information: ${subject} - # prompt tokens`, { name: `${subject} prompt tokens`, unit: 'tokens' as const }],
    ...(clevaFixedOut.has(subject) ? [] : [[`General information: ${subject} - # output tokens`, { name: `${subject} output tokens`, unit: 'tokens' as const }]]),
    ...(clevaVaryTrunc.has(subject) ? [[`General information: ${subject} - truncated`, { name: `${subject} truncated output rate`, unit: 'score' as const, better: 'lower' as const, note: 'Fraction from 0 to 1.' }]] : []),
  ]),
  ...clevaCalibrated.map((subject) => [`Calibration: ${subject} - ECE (10-bin)`, { name: `${subject} calibration ECE`, unit: 'score' as const, better: 'lower' as const, note: '10-bin expected calibration error.' }]),
]);

const board: Leaderboard = {
  benchmark: "cleva",
  url: "https://crfm.stanford.edu/helm/cleva/latest/",
  feed: FEED,
  terms: "Stanford licenses the HELM code under Apache 2.0. The results table gives no separate reuse terms. https://github.com/stanford-crfm/helm/blob/63754d05db6f874e41a395880fb573890a13e791/LICENSE",
  parts: {
    'Classical Chinese understanding - EM': 'Classical Chinese understanding (EM)',
    'Commonsense reasoning - EM': 'Commonsense reasoning (EM)',
    'Coreference resolution - EM': 'Coreference resolution (EM)',
    'Cultural knowledge - EM': 'Cultural knowledge (EM)',
    'Mathematical calculation - EM': 'Mathematical calculation (EM)',
    'Mathematical reasoning - EM (Math)': 'Mathematical reasoning (EM Math)',
    'Paraphrase generation - iBLEU (Chinese)': 'Paraphrase generation (iBLEU Chinese)',
    'Paraphrase identification - EM': 'Paraphrase identification (EM)',
    'Pinyin transliteration - BLEU-1 (Chinese)': 'Pinyin transliteration (BLEU-1 Chinese)',
    'Reading comprehension - EM': 'Reading comprehension (EM)',
    'Sentiment analysis - EM': 'Sentiment analysis (EM)',
    'Summarization - ROUGE-2 (Chinese)': 'Summarization (ROUGE-2 Chinese)',
    'Text classification - EM': 'Text classification (EM)',
    'Toxicity detection - EM': 'Toxicity detection (EM)',
    'Translation - BLEU': 'Translation (BLEU)',
  },
  stats: clevaStats,
  aliases: {"Vicuna v1.3 (13B)":"vicuna-13b-v1-3"},
  async fetch() {
    const tables = await fetchJson<Table[]>(FEED);
    const accuracy = tables.find(t => t.title === 'Accuracy');
    if (!accuracy || accuracy.header[1]?.value !== 'Mean win rate' || accuracy.header.length < 17 || accuracy.rows.length < 4)
      throw new Error('Incomplete CLEVA Accuracy table');
    return accuracy.rows.map(cells => {
      const model = cells[0].value;
      const score = cells[1].value;
      if (typeof model !== 'string' || typeof score !== 'number') throw new Error('Invalid CLEVA headline');
      const metrics: Record<string, number> = {};
      for (const table of tables) {
        const row = table.rows.find(r => r[0].value === model);
        if (!row || row.length !== table.header.length) throw new Error('Incomplete CLEVA table for ' + model);
        for (const [i, {value}] of row.entries()) {
          if (i === 0 || (table === accuracy && i === 1) || typeof value !== 'number') continue;
          const column = table.header[i].value;
          const key = table === accuracy ? column : table.title + ': ' + column;
          if (table !== accuracy && !(key in clevaStats)) continue;
          metrics[key] = value;
        }
      }
      return { model, score, metrics };
    });
  },
};
export default board;

// TyDi QA (Clark et al., TACL 2020, arXiv:2003.05002) evaluates information-seeking question answering across
// eleven typologically diverse languages. Google's original mljam leaderboard backend is offline, so this
// static paper importer parses Table 7 (GoldP v1.1 task, the split standardly reported in model cards) as
// the single consistent headline axis, with per-language GoldP F1 in parts and Table 5 primary Passage
// Answer and Minimal Answer scores attached as stats on the fine-tuned mBERT row.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://arxiv.org/pdf/2003.05002';

const GOLDP_LANGS: [string, string][] = [
  ['english', 'English'],
  ['arabic', 'Arabic'],
  ['bengali', 'Bengali'],
  ['finnish', 'Finnish'],
  ['indonesian', 'Indonesian'],
  ['kiswahili', 'Kiswahili'],
  ['korean', 'Korean'],
  ['russian', 'Russian'],
  ['telugu', 'Telugu'],
];

const parts: Record<string, BoardPart> = Object.fromEntries(
  GOLDP_LANGS.map(([k, name]) => [k, { name, group: 'Language', unit: '%' }]),
);

const board: Leaderboard = {
  benchmark: 'tydiqa',
  url: 'https://arxiv.org/abs/2003.05002',
  feed: `${FEED} (Tables 5 and 7)`,
  static: 'paper',
  terms: 'arXiv permits automated reading of papers under robots.txt. Paper tables are attributed to their authors. https://arxiv.org/abs/2003.05002',
  headline: 'GoldP v1.1 overall F1 across non-English languages from Table 7 of the TyDi QA paper, with per-language GoldP F1 in parts and Table 5 primary Passage Answer and Minimal Answer scores in stats.',
  notModels: /^(?:Lesser Human|Human|First passage baseline)\b/i,
  parts,
  stats: {
    primaryPassageF1: { name: 'Primary passage answer F1', unit: '%', better: 'higher' },
    primaryPassagePrecision: { name: 'Primary passage answer precision', unit: '%', better: 'higher' },
    primaryPassageRecall: { name: 'Primary passage answer recall', unit: '%', better: 'higher' },
    minimalAnswerF1: { name: 'Primary minimal answer F1', unit: '%', better: 'higher' },
    minimalPrecision: { name: 'Primary minimal answer precision', unit: '%', better: 'higher' },
    minimalRecall: { name: 'Primary minimal answer recall', unit: '%', better: 'higher' },
  },
  async fetch() {
    const raw = await pdfText(FEED);

    const t5End = raw.indexOf('Table 5: Quality on the');
    if (t5End < 0) throw new Error('TyDi QA Table 5 missing from PDF');
    const t5Block = raw.slice(Math.max(0, t5End - 2200), t5End);

    let mbPassOverall: { f1: number; p: number; r: number } | undefined;
    let mbMinOverall: { f1: number; p: number; r: number } | undefined;

    const ROW_T5 = /^\s*\(?([A-Za-z]+)\)?\s+[\d,]+\s+([\d.]+)\s+\(([\d.]+)\/([\d.]+)\)\s+([\d.]+)\s+\(([\d.]+)\/([\d.]+)\)\s+([\d.]+)\s+\(([\d.]+)\/([\d.]+)\)\s+([\d.]+)\s+\(([\d.]+)\/([\d.]+)\)/;
    for (const line of t5Block.split(/\r?\n/)) {
      const m = line.match(ROW_T5);
      if (!m) continue;
      if (m[1].toLowerCase() === 'overall') {
        mbPassOverall = { f1: Number(m[5]), p: Number(m[6]), r: Number(m[7]) };
        mbMinOverall = { f1: Number(m[11]), p: Number(m[12]), r: Number(m[13]) };
      }
    }
    if (!mbPassOverall || !mbMinOverall) {
      throw new Error('Incomplete TyDi QA Table 5 parse: missing overall mBERT scores');
    }

    const t7End = raw.indexOf('Table 7: F1 scores for the');
    if (t7End < 0) throw new Error('TyDi QA Table 7 missing from PDF');
    const t7Block = raw.slice(Math.max(0, t7End - 1500), t7End);

    const goldpLang: Record<string, number> = {};
    const zsLang: Record<string, number> = {};
    let goldpOverall: number | undefined;
    let zsOverall: number | undefined;

    const ROW_T7 = /^\s*\(?([A-Za-z]+)\)?\s+\(?([\d.]+)\)?\s+\(?([\d.]+)\)?\s+\(?([\d.]+)\)?/;
    for (const line of t7Block.split(/\r?\n/)) {
      const m = line.match(ROW_T7);
      if (!m) continue;
      const lang = m[1].toLowerCase();
      if (lang === 'overall') {
        goldpOverall = Number(m[2]);
        zsOverall = Number(m[3]);
      } else if (GOLDP_LANGS.some(([k]) => k === lang)) {
        goldpLang[lang] = Number(m[2]);
        zsLang[lang] = Number(m[3]);
      }
    }
    if (goldpOverall === undefined || zsOverall === undefined || Object.keys(goldpLang).length < 9) {
      throw new Error(`Incomplete TyDi QA Table 7 parse: ${Object.keys(goldpLang).length} languages`);
    }

    const rows: LeaderboardRow[] = [
      {
        model: 'mBERT',
        setting: 'GoldP v1.1 fine-tuned',
        score: goldpOverall,
        metrics: {
          ...goldpLang,
          primaryPassageF1: mbPassOverall.f1,
          primaryPassagePrecision: mbPassOverall.p,
          primaryPassageRecall: mbPassOverall.r,
          minimalAnswerF1: mbMinOverall.f1,
          minimalPrecision: mbMinOverall.p,
          minimalRecall: mbMinOverall.r,
        },
      },
      {
        model: 'mBERT',
        setting: 'GoldP v1.1 zero-shot (SQuAD v1.1)',
        score: zsOverall,
        metrics: zsLang,
      },
    ];
    return rows;
  },
};

export default board;

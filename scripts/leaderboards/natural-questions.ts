// Natural Questions (Kwiatkowski et al., TACL 2019) evaluates question answering over real Google search
// queries and Wikipedia pages on both long-answer and short-answer tasks. Google's original mljam leaderboard
// backend is offline, so this static paper importer parses Table 3 from the official ACL Anthology PDF,
// reporting Long Answer Test F1 as the headline score with Long Answer Dev F1 and Short Answer Dev and Test F1
// in parts and precision and recall in stats.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/Q19-1026.pdf';

const parts: Record<string, BoardPart> = {
  longDevF1: { name: 'Long answer dev F1', group: 'Long answer', unit: '%' },
  shortTestF1: { name: 'Short answer test F1', group: 'Short answer', unit: '%' },
  shortDevF1: { name: 'Short answer dev F1', group: 'Short answer', unit: '%' },
};

const board: Leaderboard = {
  benchmark: 'natural-questions',
  url: 'https://aclanthology.org/Q19-1026/',
  feed: `${FEED} (Table 3)`,
  static: 'paper',
  terms: 'ACL Anthology papers are published under CC BY 4.0. https://aclanthology.org/Q19-1026/',
  headline: 'Long answer test F1 from Table 3 of the original Natural Questions paper, with dev F1, short answer F1, and precision and recall kept in parts and stats.',
  notModels: /^(?:Single annotator|Super-annotator|First paragraph|Most frequent|Closest question)\b/i,
  parts,
  stats: {
    longTestP: { name: 'Long answer test precision', unit: '%', better: 'higher' },
    longTestR: { name: 'Long answer test recall', unit: '%', better: 'higher' },
    longDevP: { name: 'Long answer dev precision', unit: '%', better: 'higher' },
    longDevR: { name: 'Long answer dev recall', unit: '%', better: 'higher' },
    shortTestP: { name: 'Short answer test precision', unit: '%', better: 'higher' },
    shortTestR: { name: 'Short answer test recall', unit: '%', better: 'higher' },
    shortDevP: { name: 'Short answer dev precision', unit: '%', better: 'higher' },
    shortDevR: { name: 'Short answer dev recall', unit: '%', better: 'higher' },
  },
  async fetch() {
    const raw = await pdfText(FEED);
    const cap = raw.indexOf('Table 3: Precision (P), recall (R)');
    if (cap < 0) throw new Error('Natural Questions Table 3 missing from ACL PDF');
    const block = raw.slice(Math.max(0, cap - 1200), cap);
    const lines = block.split(/\r?\n/);
    const rows: LeaderboardRow[] = [];

    const parseVal = (tok?: string) => {
      if (!tok || /^[–—-]+$/.test(tok)) return undefined;
      const n = Number(tok);
      return Number.isFinite(n) ? n : undefined;
    };

    const SYSTEM_PAT = /^\s*(DocumentQA|DecAtt \+ DocReader)\s+(.+)$/;
    for (const line of lines) {
      const m = line.match(SYSTEM_PAT);
      if (!m) continue;
      const model = m[1].trim();
      const toks = m[2].trim().split(/\s+/);
      if (toks.length < 12) throw new Error(`Unexpected Table 3 token count for ${model}: ${toks.length}`);
      const [ldP, ldR, ldF1, ltP, ltR, ltF1, sdP, sdR, sdF1, stP, stR, stF1] = toks.map(parseVal);
      if (ltF1 === undefined) throw new Error(`Missing Long Answer Test F1 for ${model}`);
      const metrics: Record<string, number> = {};
      if (ldF1 !== undefined) metrics.longDevF1 = ldF1;
      if (stF1 !== undefined) metrics.shortTestF1 = stF1;
      if (sdF1 !== undefined) metrics.shortDevF1 = sdF1;
      if (ltP !== undefined) metrics.longTestP = ltP;
      if (ltR !== undefined) metrics.longTestR = ltR;
      if (ldP !== undefined) metrics.longDevP = ldP;
      if (ldR !== undefined) metrics.longDevR = ldR;
      if (stP !== undefined) metrics.shortTestP = stP;
      if (stR !== undefined) metrics.shortTestR = stR;
      if (sdP !== undefined) metrics.shortDevP = sdP;
      if (sdR !== undefined) metrics.shortDevR = sdR;
      rows.push({ model, score: ltF1, metrics });
    }
    if (rows.length !== 2) throw new Error(`Expected 2 Natural Questions Table 3 neural systems, got ${rows.length}`);
    return rows;
  },
};

export default board;

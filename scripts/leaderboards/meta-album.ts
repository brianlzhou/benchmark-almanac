// Meta-Album tests few-shot image classification. Figure 11 defines the headline as "Averages over 30 released Meta-Album datasets".
// Tables 5 to 8 and 10 to 14 give equally sized evaluations for each dataset, including individual 95% intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2302.08909';
const PARTS: Record<string, string> = {
  BRD: 'BRD (Large animals)', DOG: 'DOG (Large animals)', AWA: 'AWA (Large animals)',
  PLK: 'PLK (Small animals)', INS_2: 'INS_2 (Small animals)', INS: 'INS (Small animals)',
  FLW: 'FLW (Plants)', PLT_NET: 'PLT_NET (Plants)', FNG: 'FNG (Plants)',
  PLT_VIL: 'PLT_VIL (Plant diseases)', MED_LF: 'MED_LF (Plant diseases)', PLT_DOC: 'PLT_DOC (Plant diseases)',
  BCT: 'BCT (Microscopy)', PNU: 'PNU (Microscopy)', PRT: 'PRT (Microscopy)',
  RESISC: 'RESISC (Remote sensing)', RSICB: 'RSICB (Remote sensing)', RSD: 'RSD (Remote sensing)',
  CRS: 'CRS (Vehicles)', APL: 'APL (Vehicles)', BTS: 'BTS (Vehicles)',
  TEX: 'TEX (Manufacturing)', TEX_DTD: 'TEX_DTD (Manufacturing)', TEX_ALOT: 'TEX_ALOT (Manufacturing)',
  SPT: 'SPT (Human actions)', ACT_40: 'ACT_40 (Human actions)', ACT_410: 'ACT_410 (Human actions)',
  MD_MIX: 'MD_MIX (OCR)', MD_5_BIS: 'MD_5_BIS (OCR)', MD_6: 'MD_6 (OCR)',
};
const board: Leaderboard = {
  benchmark: 'meta-album', feed, url: feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'Mean accuracy across the 30 paper datasets gives each dataset equal weight, with 1,800 test tasks per dataset.',
  parts: PARTS,
  async fetch() {
    const paper = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [number, shots] of [[5, 1], [6, 5], [7, 10], [8, 20], [10, 1], [11, 5], [12, 10], [13, 20], [14, 0]]) {
      const figure = paper.match(new RegExp('<figure\\b[^>]*\\bid="[^"]*\\.T' + number + '"[\\s\\S]*?</figure>'))?.[0];
      const t = figure && inlinePaperTables(figure).find(t => t[0]?.join('|') === 'Domain|Dataset ID|TrainFromScratch|Finetuning|MatchingNet|ProtoNet|FO-MAML');
      if (!t || t.length !== 31) throw Error('Missing Meta-Album datasets in Table ' + number);
      for (const [i, model] of t[0].slice(2).entries()) {
        const metrics: Record<string, number> = {};
        let total = 0;
        for (const row of t.slice(1)) {
          const [, id] = row;
          const match = row[i + 2].match(/^([\d.]+)\s*\\pm\s*([\d.]+)$/);
          if (!id || !match || id in metrics) throw Error('Invalid accuracy or interval for ' + id);
          total += metrics[id] = Number(match[1]);
          metrics[id + 'Ci95'] = Number(match[2]);
        }
        const config = shots ? '5-way ' + shots + '-shot' : 'any-way any-shot';
        rows.push({ model, score: total / 30, metrics, trials: 3, setting: (number < 10 ? 'Within domain, ' : 'Cross-domain, ') + config });
      }
    }
    return checked(rows, 45);
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the TECH and HOUSE MRR scores, computed by this importer.
// SkillSpan-ESCO evaluates skill extraction against ESCO labels with mean reciprocal rank and R-Precision metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://ugentt2k.github.io/papers/2022/decorte2022recsyshr.pdf';
const board: Leaderboard = {
  benchmark: 'skillspan-esco', static: 'paper', url: FEED, feed: FEED,
  terms: 'The paper is available from the authors for research use. https://ugentt2k.github.io/papers/2022/decorte2022recsyshr.pdf',
  headline: 'The paper reports no overall score, so this is the plain mean of the TECH and HOUSE MRR scores.',
  parts: { TECH: { name: 'TECH' }, HOUSE: { name: 'HOUSE' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/TECH\s+HOUSE\s*\n\s*MRR\s+RP@5\s+RP@10\s+MRR\s+RP@5\s+RP@10/)[1]?.split(/Table 3/)[0];
    if (!table) throw new Error('Table 3 header missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(Baseline classifier|Classifierneg|Classifierneg without embeddings|Classifierneg without Levenshtein|Classifierneg without siblings)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) continue;
      const tech = Number(m[2]), house = Number(m[5]);
      rows.push({ model: m[1], score: (tech + house) / 2, metrics: { TECH: tech, TECH_RP5: Number(m[3]), TECH_RP10: Number(m[4]), HOUSE: house, HOUSE_RP5: Number(m[6]), HOUSE_RP10: Number(m[7]) }, });
    }
    if (rows.length !== 5) throw new Error(`Expected 5 Table 3 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;

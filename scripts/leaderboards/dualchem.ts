// DualChem tests model accuracy on 600 ambiguous dual-use chemistry questions.
// The headline is accuracy with refusals counted as incorrect from Table 4.
// This importer reads the fixed Table 4 in the authors' PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://cdn.sanity.io/files/50zba0eo/production/740e74ec297aa119d37b87d4706540e322551ba0.pdf';
const board: Leaderboard = {
  benchmark: 'dualchem', static: 'paper',
  url: 'https://scale.com/blog/dualchem-evaluating-ai-models-dual-use-chemistry-risks', feed: FEED,
  terms: 'Scale AI publishes the paper under its stated terms. Table 4 is credited to the authors.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const section = text.split('Table 4. Per-model accuracy')[1]?.split('Table 5. Dual-use')[0];
    if (!section) throw new Error('DualChem Table 4 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split(/\r?\n/)) {
      const m = line.match(/^\s{0,30}([A-Za-z][A-Za-z0-9 .-]+?)\s+(\d+\.\d)\s+(\d+\.\d)\s+(\d+\.\d)\s+(\d+\.\d)\s+(\d+\.\d)\s+(\d+\.\d)\s*$/);
      if (!m) continue;
      const [, model, acc, refusal, answered, webAcc, webRefusal, webAnswered] = m;
      rows.push({ model: model.trim(), score: Number(acc), metrics: { refusalRate: Number(refusal), answeredAccuracy: Number(answered), webSearchAccuracy: Number(webAcc), webSearchRefusalRate: Number(webRefusal), webSearchAnsweredAccuracy: Number(webAnswered) } });
    }
    if (rows.length < 30) throw new Error(`DualChem: ${rows.length} rows, expected 33`);
    return rows;
  },
};
export default board;

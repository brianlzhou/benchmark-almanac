// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// JOKER tests pun location in three languages and pun interpretation in English. Tables 3 and 5 give test scores.
// The headline uses the full-test denominators. The additional metrics retain coverage and scores on attempted items.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-3497/paper-150.pdf';
const runs = [
  ['Croland', 'GPT3', 'Croland_GPT3', 'Croland_task_2_EN_GPT3'],
  ['Les_miserables', 'T5', 'Les_miserables_simplet5', 'Les_miserables_simplet5'],
  ['Smroltra', 'BLOOM', 'Smroltra_BLOOM', 'Smroltra_task_2_Bloom'],
  ['Smroltra', 'BLOOM', 'Smroltra_BLOOM', 'Smroltra_task_2_bloom_WN'],
  ['Smroltra', 'GPT3', 'Smroltra_GPT3', 'Smroltra_task_2_GPT3'],
  ['Smroltra', 'GPT3', 'Smroltra_GPT3', 'Smroltra_task_2_GPT3_WN'],
  ['Smroltra', 'T5', 'Smroltra_SimpleT5', 'Smroltra_task_2_SimpleT5_WN'],
  ['UBO', 'T5', 'UBO_SimpleT5', 'UBO_task_2.2_SimpleT5'],
];
function read(table: string, id: string, width: number) {
  const cells = table.split('\n').map(line => line.trim().split(/\s+/)).find(row => row[0] === id);
  if (!cells || cells.length !== width + 1) throw new Error('Missing JOKER run ' + id);
  const values = cells.slice(1).map(c => Number(c.replace(/[,%]/g, '')));
  if (!values.every(Number.isFinite)) throw new Error('Invalid JOKER score');
  return values;
}
const board: Leaderboard = {
  benchmark: 'clef-joker-2023-pun-location-and-interpretation', url: feed, feed,
  terms: 'The authors publish the paper under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { en: 'Pun location (English)', fr: 'Pun location (French)', es: 'Pun location (Spanish)', interpretation: 'Pun interpretation (English)' },
  async fetch() {
    const paper = await pdfText(feed);
    const location = paper.split('Results for Task 2.1 (pun location) on the test data')[1]?.split('\f')[0];
    const interpretation = paper.split('Results for Task 2.2 (pun interpretation) on the test data')[1]?.split('\n\n')[0];
    if (!location?.includes('run ID') || !interpretation?.includes('part_score')) throw new Error('Missing test tables');
    return checked(runs.map(([submitter, model, loc, interp]) => {
      const [enCount, en, enAttempted, frCount, fr, frAttempted, esCount, es, esAttempted] = read(location, loc, 9);
      const [interpretationCount, value, interpretationAttempted] = read(interpretation, interp, 3);
      return { model, submitter, setting: interp, score: (en + fr + es + value) / 4,
        metrics: { en, fr, es, interpretation: value, enCount, frCount, esCount, interpretationCount,
          enAttempted, frAttempted, esAttempted, interpretationAttempted } };
    }), 8);
  },
};
export default board;

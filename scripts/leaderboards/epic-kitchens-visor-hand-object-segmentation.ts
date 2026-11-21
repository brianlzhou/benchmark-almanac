// EPIC-KITCHENS VISOR ranks the open testing table by Hand AP.
// Read the official HTML because the CSV omits four of the five displayed AP measures.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/9969/results/16086";
const board: Leaderboard = {
  benchmark: "epic-kitchens-visor-hand-object-segmentation",
  url: "https://codalab.lisn.upsaclay.fr/competitions/9969#results",
  feed: FEED,
  terms: "The terms require written permission to redistribute VISOR data. They give no separate score license. https://codalab.lisn.upsaclay.fr/competitions/9969#learn_the_details-terms_and_conditions The robots URL returns HTML.",
  parts: { side: 'Hand+Side', contact: 'Hand+Contact', object: 'Object', handObject: 'Hand+Object' },
  async fetch() {
    const table = tables(await fetchText(FEED))[0];
    const cols = table?.[2];
    if (!cols || cols.map(c => c.text).join('|') !== 'Hand|Hand+Side|Hand+Contact|Object|Hand+Object' ||
        !cols[0].attrs.class?.includes('column-selected') || table.length < 7) throw new Error('VISOR table changed');
    return table.slice(3).map(row => {
      const cells = row.map(c => c.text);
      const [, model, entries, day, ...values] = cells;
      const scores = values.map(v => parseFloat(v));
      const match = day.match(/^(\d\d)\/(\d\d)\/(\d\d)$/);
      if (scores.length !== 5 || !scores.every(Number.isFinite) || !model || !match) throw new Error('Incomplete VISOR entry');
      const [score, side, contact, object, handObject] = scores;
      return { model, submitter: model, date: '20' + match[3] + '-' + match[1] + '-' + match[2], score,
        metrics: { entries: Number(entries), side, contact, object, handObject } };
    });
  },
};
export default board;

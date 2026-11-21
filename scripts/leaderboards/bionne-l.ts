// BioNNE-L ranks bilingual entity linking submissions by top-one accuracy. The official CodaLab export names submissions by user and also reports top-five accuracy and reciprocal rank.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/21568/results/36898/data";

const board: Leaderboard = {
  benchmark: "bionne-l",
  url: "https://codalab.lisn.upsaclay.fr/competitions/21568#results",
  feed: FEED,
  terms: "CodaLab lists entrants by username. The bilingual test results page gives no score reuse license. https://codalab.lisn.upsaclay.fr/competitions/21568/results/36898 The robots.txt URL returns HTML.",
  async fetch() {
    const data = parseCsv(await fetchText(FEED));
    if (data.length < 7) throw new Error('Expected all seven bilingual submissions');
    return data.map((r) => {
      const value = (field: string) => {
        const match = r[`b'${field}'`]?.match(/^(\d+(?:\.\d+)?) \(\d+\)$/);
        if (!match) throw new Error(`Missing ${field} for ${r.User}`);
        return Number(match[1]);
      };
      if (!r.User || !r.submission_pk) throw new Error('Missing submission identity');
      return { model: r.User, submitter: r.User, score: value('Accuracy@1'),
        metrics: { accuracyAt5: value('Accuracy@5'), mrr: value('MRR') } };
    });
  },
};
export default board;

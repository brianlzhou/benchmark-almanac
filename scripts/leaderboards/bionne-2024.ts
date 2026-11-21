// BioNNE scores nested medical entity recognition in English and Russian. The bilingual test supplies the headline F1.
// CodaLab exports scores for each evaluation phase. Language-specific F1 scores attach to the same entrant.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://codalab.lisn.upsaclay.fr/competitions/16464/results/27907/data";

const board: Leaderboard = {
  benchmark: "bionne-2024",
  url: "https://codalab.lisn.upsaclay.fr/competitions/16464#results",
  feed,
  terms: "CodaLab lists entrants by username. The English test results page gives no score reuse license. https://codalab.lisn.upsaclay.fr/competitions/16464/results/27908 The site returns 404 for robots.txt.",
  parts: { english: 'English NNER: evaluation', russian: 'Russian NNER: evaluation' },
  async fetch() {
    async function phase(id: string, minimum: number) {
      const entries = parseCsv(await fetchText(feed.replace('27907', id)));
      if (entries.length < minimum) throw new Error('Missing BioNNE results in phase ' + id);
      return entries.map(entry => {
        const f1 = entry["b'F1 score'"]?.match(/^([\d.]+)\s+\(\d+\)$/);
        if (!entry.User || !entry.submission_pk || !f1) throw new Error('Invalid BioNNE submission');
        return { model: entry.User, submitter: entry.User, score: +f1[1], metrics: {} as Record<string, number> };
      });
    }
    const rows = await phase('27907', 2);
    for (const [id, key, min] of [['27908','english',5], ['27909','russian',3]] as const) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const results = await phase(id, min);
      for (const row of rows) {
        const match = results.find(r => r.model === row.model);
        if (match) row.metrics[key] = match.score;
      }
    }
    return rows;
  },
};

export default board;

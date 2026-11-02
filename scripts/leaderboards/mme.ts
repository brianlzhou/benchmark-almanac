// MME. The makers keep the leaderboards as markdown tables in the README of the Evaluation branch of
// BradyFU/Awesome-Multimodal-Large-Language-Models ("Leaderboards of Available Models"): Perception (the sum
// of ten subtask scores, out of 2000), Cognition (four subtasks, out of 800) and one table per subtask. The
// board has no combined total. Perception is its first board and the figure launch posts quote most often
// ("MME-P"), so it is the score, in the board's own points. Claims of the perception plus cognition sum or a
// normalized percentage do not line up with it. Medal emoji stand in for the top three ranks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'BradyFU/Awesome-Multimodal-Large-Language-Models';
const FEED = ghRaw(REPO, 'README.md', 'Evaluation');

const board: Leaderboard = {
  benchmark: 'mme',
  url: `https://github.com/${REPO}/tree/Evaluation`,
  feed: `${FEED} (Perception table, Score)`,
  terms: 'README tables in the Evaluation branch of the BradyFU/Awesome-Multimodal-Large-Language-Models GitHub repository, which states no license; scores are cited to the MME authors.',
  aliases: {},
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.heading === 'Perception');
    if (!t) throw new Error('MME Perception table not found');
    const iModel = t.head.indexOf('Model');
    const iScore = t.head.indexOf('Score');
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iScore]);
      if (r[iModel] && Number.isFinite(score)) rows.push({ model: r[iModel], score });
    }
    return rows;
  },
};
export default board;

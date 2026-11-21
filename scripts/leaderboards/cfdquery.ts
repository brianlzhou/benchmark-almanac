// CFDQuery measures accuracy on 90 fluid simulation questions. The results site's embedded JSON contains the original paper scores and the 2026 runs on the same questions.
import type { Leaderboard } from './types.ts';
import { cfdResults } from './cfdcodebench.ts';

const FEED = "https://raw.githubusercontent.com/nithinsomu/cfdllmbench_v2/main/index.html";

const board: Leaderboard = {
  benchmark: "cfdquery",
  url: "https://nithinsomu.github.io/cfdllmbench_v2/#results",
  feed: FEED,
  terms: "The benchmark repository uses BSD 3-Clause. The separate results site lists no score license. https://github.com/NLR-Theseus/cfdllmbench/blob/main/LICENSE The results site returns a 404 page for robots.txt.",
  aliases: { 'Haiku 3.5': 'claude-3-5-haiku' },
  async fetch() {
    const { paper_models, v2_models } = await cfdResults(FEED);
    if (paper_models.length < 6 || v2_models.length < 6) throw new Error('Incomplete CFDQuery series');
    return [...paper_models, ...v2_models].map((r) => {
      if (!r.name || !Number.isFinite(r.cfdquery)) throw new Error('Missing CFDQuery accuracy');
      const effort = r.name.match(/ \(effort=([^)]+)\)$/);
      return { model: effort ? r.name.slice(0, effort.index) : r.name, setting: effort?.[1], score: r.cfdquery * 100,
        metrics: 'cfdquery_correct' in r ? { correct: Number(r.cfdquery_correct) } : undefined };
    });
  },
};
export default board;

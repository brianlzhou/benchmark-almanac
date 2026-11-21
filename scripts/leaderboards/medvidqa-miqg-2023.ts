// MedVidQA ranks generated medical questions by BLEU-4. Table 13 of the TRECVID report gives five metrics for each official run.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://www-nlpir.nist.gov/projects/tvpubs/tv23.papers/tv23overview.pdf";

const board: Leaderboard = {
  benchmark: "medvidqa-miqg-2023", static: 'paper',
  url: "https://codalab.lisn.upsaclay.fr/competitions/13546",
  feed,
  terms: "The publisher does not specify separate score reuse terms in the supplied source. The feed host returns no robots.txt.",
  async fetch() {
    const source = await pdfText(feed);
    const block = source.match(/Team\s+RunID\s+BLEU\s+BLEU-4\s+ROUGE-2\s+ROUGE-L\s+BERTScore([\s\S]*?)Table 13:/)?.[1];
    if (!block) throw new Error('Missing official MIQG results');
    const rows: LeaderboardRow[] = [];
    for (const line of block.trim().split('\n')) {
      if (!line.trim()) continue;
      const m = line.trim().match(/^(.+?)\s+(run-\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) throw new Error('Invalid MIQG run');
      rows.push({ model: m[1], submitter: m[1], setting: m[2], score: +m[4], metrics: { bleu: +m[3], rouge2: +m[5], rougeL: +m[6], bertScore: +m[7] } });
    }
    if (rows.length < 8) throw new Error('Incomplete MIQG standings');
    return rows;
  },
};
export default board;

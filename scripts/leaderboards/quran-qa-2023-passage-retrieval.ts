// Qur’an QA ranks Arabic passage retrieval runs by MAP@10. Table 3 in the organizers’ paper gives each run, baseline and MRR@10.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2023.arabicnlp-1.76.pdf#page=4";
const board: Leaderboard = {
  benchmark: "quran-qa-2023-passage-retrieval", static: 'paper',
  url: "https://aclanthology.org/2023.arabicnlp-1.76.pdf#page=4",
  feed: FEED,
  terms: "The table lists individual runs. The count gives participating teams. ACL publishes the paper under CC BY 4.0. https://aclanthology.org/2023.arabicnlp-1.76/ The host has no published robots directives at /robots.txt.",
  parts: { mrr: { name: 'MRR@10', unit: 'score' } },
  async fetch() {
    const pdf = await pdfText(FEED);
    const section = pdf.match(/Team\s+Run\s+MAP@10\s+MRR@10([\s\S]*?)Table 3: PR evaluation/);
    if (!section) throw new Error('Missing passage retrieval table');
    const rows = [...section[1].matchAll(/(?:^|\s{2,})([\w-]+)\s+([\w-]+)\s+(\d\.\d{4})\s+(\d\.\d{4})\s*$/gm)].map(([,team,run,map,mrr]) =>
      ({ model: team === 'Baseline' ? run : team, setting: team === 'Baseline' ? undefined : run, submitter: team, score: Number(map), metrics: { mrr: Number(mrr) } }));
    if (rows.length < 23) throw new Error('Missing passage retrieval runs');
    return rows;
  },
};
export default board;

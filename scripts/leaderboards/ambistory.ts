// AmbiStory tests whether models can judge the plausibility of word senses in short stories.
// SemEval Table 2 ranks systems by the average of accuracy within standard deviation and Spearman correlation.
// Table 3 identifies the models. We include teams with one unambiguous model and the two named model baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2026.semeval-1.448.pdf';
const board: Leaderboard = {
  benchmark: 'ambistory',
  url: 'https://aclanthology.org/2026.semeval-1.448/',
  feed,
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  harnesses: 'system',
  async fetch() {
    const paper = await pdfText(feed);
    const scores = paper.split('# Team Name Acc. w/in SD (%)')[1]?.split('Table 2: Final leaderboard')[0];
    const components = paper.split(/Team Name\s+System\s+Model Components\s+Additional Keywords/)[1]?.split('Table 3: Summary')[0];
    if (!scores?.includes('Avg.') || !components) throw new Error('Missing SemEval results or model components');
    const systems = new Map<string, string>();
    for (const line of components.split('\n')) {
      const match = line.match(/^\s*(.+?)\s{2,}(Enc\.|Gen\.)\s{2,}([\w.-]+)\s{2,}\S/);
      if (match) systems.set(match[1], match[3]);
    }
    const rows: LeaderboardRow[] = [];
    for (const line of scores.split('\n')) {
      const team = line.match(/^\s*\d+\s+(.+?)\s{2,}([\d.]+)\s+(-?\.[0-9]+)\s+(\.[0-9]+)/);
      if (team && systems.has(team[1])) {
        rows.push({ model: systems.get(team[1])!, submitter: team[1], harness: team[1], score: Number(team[4]),
          metrics: { accuracyWithinSD: Number(team[2]), spearman: Number(team[3]) } });
      }
      const baseline = line.match(/^\s*(GPT-4o|Llama-3\.1 8B) Baseline\s+(\.[0-9]+)/);
      if (baseline) rows.push({ model: baseline[1], score: Number(baseline[2]), setting: 'Organizer baseline' });
    }
    return checked(rows, 15);
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// The tracks assess tutor feedback and tutor identification. Each official leaderboard ranks teams by exact macro F1.
// Table 28 of the organizer paper identifies the model each included team used across tracks.
// https://aclanthology.org/2025.bea-1.77/
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://sig-edu.org/sharedtask/2025';
const parts = {
  mistakeIdentification: 'Mistake Identification', mistakeLocation: 'Mistake Location',
  providingGuidance: 'Providing Guidance', actionability: 'Actionability', tutorIdentification: 'Tutor Identification',
};
const board: Leaderboard = {
  benchmark: 'bea-2025-pedagogical-ability-assessment', url: feed + '#results', feed, parts, harnesses: 'system',
  terms: 'The organizers release the task under MIT. https://github.com/kaushal0494/UnifyingAITutorEvaluation',
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [team, model] of [['MSA', 'Mathstral-7B-v0.1'], ['Wonderland_EDU@HKU', 'LLaMA-3.2-3B']]) {
      const metrics: Record<string, number> = {};
      let sum = 0;
      for (const [index, [key, name]] of Object.entries(parts).entries()) {
        const section = html.split('id="track-' + (index + 1) + '-' + name.toLowerCase().replaceAll(' ', '-') + '"')[1];
        const table = section && tables(section)[0];
        if (!table || table[0][1]?.text !== 'Team' || table[0][3]?.text !== 'Ex. F1') throw new Error('Missing leaderboard for ' + name);
        const cells = table.find(r => r[1]?.text === team);
        if (!cells) throw new Error('Missing team ' + team);
        for (const [column, suffix] of [[3, ''], [4, 'ExactAccuracy'], [5, 'LenientF1'], [6, 'LenientAccuracy']] as const) {
          if (index === 4 && column > 4) continue;
          if (!/^0\.\d+$|^1(?:\.0+)?$/.test(cells[column]?.text)) throw new Error('Invalid score for ' + name);
          metrics[key + suffix] = Number(cells[column].text);
        }
        sum += metrics[key];
      }
      rows.push({ model, harness: team, submitter: team, score: sum / 5, metrics });
    }
    return checked(rows, 2);
  },
};
export default board;

// AlexandriaX evaluates dialectal Arabic translation and error detection. Its subtasks use different measures.
// The headline is the first subtask's average spBLEU across 13 target varieties. The board also reports chrF++.
// Section 4.3 identifies the teams' models: https://aclanthology.org/2026.arabicnlp-sharedtasks.97/
// Thakaa's unconstrained ensemble and Namaa's mixed architectures lack a single documented model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://alexandriax.dlnlp.ai/leaderboard.html';
const systems: Record<string, string> = {
  Thakaa: 'NileChat-3B-Base', LahjaMT: 'NileChat-3B-Base', Rosetta: 'NileChat-3B-Base',
  Hasan_kh: 'NileChat-3B-Base', FCDS: 'Gemma-3-4B-IT', cepin: 'Gemma-4-31B-IT',
};

const board: Leaderboard = {
  benchmark: 'alexandriax-2026', url: feed, feed,
  terms: 'Public competition results credited to the AlexandriaX organizers. https://alexandriax.dlnlp.ai/leaderboard.html',
  harnesses: 'system',
  stats: {
    chrFpp: { name: 'chrF++', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const track of ['Constrained', 'Unconstrained']) {
      const section = html.split('<caption>' + track + ' Track</caption>')[1]?.split('</table>')[0];
      if (!section) throw new Error('Missing AlexandriaX track ' + track);
      const [header, ...entries] = tables('<table>' + section + '</table>')[0];
      if (header.map(c => c.text).join('|') !== 'Rank|Team|Participants|Average SPBLEU|Average chrF++') {
        throw new Error('Translation score columns changed');
      }
      for (const cells of entries) {
        const team = cells[1].text;
        if (!systems[team] || (team === 'Thakaa' && track === 'Unconstrained')) continue;
        if (![cells[3], cells[4]].every(c => /^\d+(\.\d+)?$/.test(c.text))) throw new Error('Missing translation score');
        rows.push({ model: systems[team], submitter: team, harness: team,
          setting: track + ' dialogue translation', score: Number(cells[3].text), metrics: { chrFpp: Number(cells[4].text) } });
      }
    }
    return checked(rows, 9);
  },
};
export default board;

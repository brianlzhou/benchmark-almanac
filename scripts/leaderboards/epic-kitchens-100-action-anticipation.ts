// EPIC-KITCHENS-100 tests whether a model can anticipate the next kitchen action.
// The CodaLab test leaderboard ranks entries by class-averaged top-five action recall.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://codalab.lisn.upsaclay.fr/competitions/702';
const feed = url + '/results/1010';
const parts = ['Overall Verb','Overall Noun','Overall Action','Unseen Verb','Unseen Noun','Unseen Action','Tail Verb','Tail Noun','Tail Action'];
const board: Leaderboard = {
  benchmark:'epic-kitchens-100-action-anticipation', url, feed,
  terms:'The organizers publish the test scores under the challenge terms at ' + url + '#learn_the_details-terms_and_conditions.',
  parts:Object.fromEntries(parts.filter(p => p !== 'Overall Action').map(p => [p,p])),
  async fetch() {
    const t = tables(await fetchText(feed)).find(t => t[0]?.[0].text === 'Test Set (Mean Top-5 Recall)');
    if (!t || t[1].slice(-3).map(c=>c.text).join('|') !== 'Overall (%)|Unseen (%)|Tail (%)' ||
        t[2].slice(-9).map(c=>c.text).join('|') !== 'Verb|Noun|Action|Verb|Noun|Action|Verb|Noun|Action')
      throw new Error('Missing EPIC-KITCHENS-100 score columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of t.slice(3)) {
      const user = cells[1].text, team = cells[4].text;
      let model: string, submitter = user;
      if (team === 'InAViT IHPC-AISG-LAHA') { model = 'InAViT'; submitter = 'IHPC-AISG-LAHA'; }
      else if (team === 'OA-OAD') model = team;
      else if (user === 'AVT-FB-UT') { model = 'AVT'; submitter = user; }
      else if (user === 'RULSTM-FUSION') model = user;
      else continue;
      if (cells.length !== 17) throw new Error('Invalid CodaLab result row');
      const metrics = Object.fromEntries(parts.map((p,i) => {
        const value = cells[8+i].text.match(/^(\d+(?:\.\d+)?)\s*\(\s*\d+\s*\)$/);
        if (!value) throw new Error('Invalid ranked score for ' + p);
        return [p,Number(value[1])];
      }));
      const [mm,dd,yy] = cells[3].text.split('/');
      rows.push({model, submitter, date:'20'+yy+'-'+mm+'-'+dd, score:metrics['Overall Action'], metrics});
    }
    return checked(rows,4);
  },
};
export default board;

// FSDKaggle2018 evaluates predictions for 41 sound classes using mean average precision at three.
// The DCASE systems ranking supplies the private and public scores, plus private scores by sound class.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://dcase.community/challenge2018/task-general-purpose-audio-tagging-results';
const board: Leaderboard = {
  benchmark: 'fsdkaggle2018', url: feed, feed,
  terms: 'DCASE publishes the competition results. Dataset license terms are listed at https://zenodo.org/records/2552860.',
  async fetch() {
    const all = tables(await fetchText(feed)).map(t => t.map(r => r.map(c => c.text)));
    const ranking = all.find(t => t[0][4] === 'mAP@3 (Private leaderboard)*' && t[0][5] === 'mAP@3 (Public leaderboard)');
    const classes = all.find(t => t[0][4] === 'mAP@3' && t[0][5] === 'acoustic guitar');
    if (!ranking || !classes || classes[0].length !== 45) throw new Error('Missing DCASE rankings or sound classes');
    const parts = classes[0].slice(5).map(name => [name.replace(/[^a-z]+(.)/g, (_, c: string) => c.toUpperCase()), name]);
    board.parts = Object.fromEntries(parts);
    const bySubmission = new Map(classes.slice(1).map(r => [r[1], r]));
    return checked(ranking.slice(1).filter(r => r[2] !== 'Baseline').map(([, submission, model, , value, publicValue]) => {
      const details = bySubmission.get(submission);
      const team = submission.match(/^(.+)_task2/i)?.[1];
      if (!team || !details || details[4] !== value || details[2] !== model) throw new Error('DCASE submission mismatch');
      const metrics = Object.fromEntries(parts.map(([key], i) => [key, numberCell(details[i + 5])]));
      return { model, submitter: team, setting: submission, score: numberCell(value), metrics: { ...metrics, publicMap3: numberCell(publicValue) } };
    }), 38);
  },
};
export default board;

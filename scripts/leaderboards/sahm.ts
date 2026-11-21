// SAHM tests Arabic financial knowledge. The authors’ HTML tables give mean MCQ accuracy and separate open-ended QA scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = "https://mbzuai-nlp.github.io/SAHM/leaderboard.html";
const mcq = ['Accounting', 'Business', 'Fatwā', 'Sentiment'];
const qa = ['Event-Cause QA', 'Islamic-Standards-QA', 'Fatwa-QA'];

const board: Leaderboard = {
  benchmark: "sahm",
  url: "https://mbzuai-nlp.github.io/SAHM/leaderboard.html",
  feed: FEED,
  terms: "The repository declares Apache License 2.0. https://github.com/mbzuai-nlp/SAHM",
  stats: { openEndedMean: { name: 'Open-ended mean score', unit: 'score', better: 'higher' }, 'ROUGE-1': { name: 'ROUGE-1', unit: '%', better: 'higher' }, 'ROUGE-2': { name: 'ROUGE-2', unit: '%', better: 'higher' }, 'ROUGE-L': { name: 'ROUGE-L', unit: '%', better: 'higher' } },
  parts: Object.fromEntries([...mcq.map(k => [k, k]), ...qa.map(k => [k, { name: k, unit: 'score' }])]),
  async fetch() {
    const [unified, summary, adaptation] = tables(await fetchText(FEED));
    if (unified[2]?.map(c => c.text).join('|') !== [...mcq, 'Mean', ...qa, 'Mean'].join('|')
      || adaptation[1]?.map(c => c.text).join('|') !== 'Accounting|Business|Fatwā|Sentiment|Mean|Event-Cause|Fatwa-QA|Islamic-Std|Mean')
      throw new Error('SAHM table headers changed');
    const fineTuned = adaptation.findIndex(r => r[0]?.text === 'Fine-tuned Models');
    const raw = [...unified.slice(3).filter(r => r.length > 1).map(cells => ({ cells, tuned: false })),
      ...adaptation.slice(fineTuned + 1).map(cells => ({ cells, tuned: true }))];
    if (fineTuned < 0 || raw.length < 23) throw new Error('Incomplete SAHM table');
    return raw.map(({ cells, tuned }) => {
      const model = cells[0].text;
      const values = cells.slice(1).map(c => num(c.text));
      if (values.length !== 9 || values.some(v => v === undefined)) throw new Error('Incomplete SAHM row for ' + model);
      const names = [...mcq, 'score', ...(tuned ? [qa[0], qa[2], qa[1]] : qa), 'openEndedMean'];
      const metrics: Record<string, number> = Object.fromEntries(names.map((k, i) => [k, values[i]!]));
      const score = metrics.score;
      delete metrics.score;
      const rouge = !tuned && summary.find(r => r[0].text === model);
      if (rouge) for (const [i, c] of rouge.slice(1).entries()) metrics[summary[0][i + 1].text] = Number(c.text);
      return { model, score, metrics, setting: tuned ? 'Fine-tuned' : undefined };
    });
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Ada-LEval tests text ordering and answer selection at adjustable context lengths. Both README tables give accuracy in percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/open-compass/Ada-LEval/HEAD/README.md';
function scores(text: string, task: string) {
  const lines = text.split('#### ' + task + ' Evaluation Results')[1]?.match(/^\|[^\n]*(?:\n\|[^\n]*)+/m)?.[0].split('\n');
  if (!lines) throw new Error('Missing ' + task + ' table');
  const cells = (s: string) => s.split('|').slice(1, -1).map(c => c.trim());
  const [title, ...lengths] = cells(lines[0]);
  if (title !== task || lengths.some(l => !/^\d+k$/.test(l))) throw new Error('Unexpected context lengths');
  const values = new Map<string, Map<string, number>>();
  for (const line of lines.slice(2)) {
    const [model, ...v] = cells(line);
    if (model === 'Random Guess') continue;
    if (v.length !== lengths.length || v.some(s => s && !/^\d+(\.\d+)?$/.test(s))) throw new Error('Invalid accuracy row');
    values.set(model, new Map(v.flatMap((s, i) => s ? [[lengths[i], Number(s)] as const] : [])));
  }
  return values;
}
const board: Leaderboard = {
  benchmark: 'ada-leval', url: 'https://github.com/open-compass/Ada-LEval', feed,
  terms: 'The authors publish the evaluation tables in https://github.com/open-compass/Ada-LEval.',
  headline: 'At each context length, the headline is the plain mean of TSort and BestAnswer accuracy. The authors report each task separately.',
  parts: { tsort: 'TSort', bestAnswer: 'BestAnswer' },
  async fetch() {
    const text = await fetchText(feed);
    const best = scores(text, 'BestAnswer');
    const rows: LeaderboardRow[] = [];
    for (const [model, lengths] of scores(text, 'TSort')) {
      for (const [length, tsort] of lengths) {
        const bestAnswer = best.get(model)?.get(length);
        if (bestAnswer === undefined) continue;
        rows.push({ model, setting: length + ' context', score: (tsort + bestAnswer) / 2, metrics: { tsort, bestAnswer } });
      }
    }
    return checked(rows, 48);
  },
};
export default board;

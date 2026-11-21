// EduBench-RU tests Russian school teaching tasks. The project README ranks models by the judges’ average score on a four-point scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/csylabs-org/edubench-ru/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "edubench-ru",
  url: "https://github.com/csylabs-org/edubench-ru#leaderboard-march-2026",
  feed: FEED,
  terms: "The authors declare the MIT License. https://github.com/csylabs-org/edubench-ru",
  parts: { eduru: 'EduRU', chvbn: 'ChvBn' },
  aliases: {"Phi-4 14B":"phi-4","Command A":"cohere-command-a"},
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === '#|Model|AVG|EduRU|ChvBn|Type');
    if (!table || table.length < 30) throw new Error('Incomplete EduBench-RU leaderboard');
    return table.slice(1).map(([, model, avg, edu, chuvash, setting]) => {
      if (![avg, edu, chuvash].every(v => v && Number.isFinite(Number(v)))) throw new Error('Missing scores for ' + model);
      return { model, score: Number(avg), setting, metrics: { eduru: Number(edu), chvbn: Number(chuvash) } };
    });
  },
};
export default board;

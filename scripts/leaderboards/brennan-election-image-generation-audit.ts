// The Brennan Center measures how often image generators accept election-related requests.
// The chart redirects to version 4, whose CSV corrects Gemini Thinking to 100 of 100 prompts.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://datawrapper.dwcdn.net/4h8Jh/4/dataset.csv";
const board: Leaderboard = {
  benchmark: "brennan-election-image-generation-audit",
  url: "https://datawrapper.dwcdn.net/4h8Jh/2/",
  feed: FEED,
  terms: "The Brennan Center lists no separate score license. Datawrapper robots.txt permits this chart.",
  async fetch() {
    const records = parseCsv(await fetchText(FEED));
    const value = '# | % of prompts accepted/generated';
    if (records.length < 17 || ['Text-to-Image Model', 'Speed', value].some(k => !(k in records[0]))) throw new Error('Missing Brennan Center results');
    let model = '';
    return records.map(r => {
      const name = r['Text-to-Image Model'].trim();
      if (name && name !== '(older)') model = name;
      const pair = r[value].trim().match(/^(\d+)\s*\|\s*(\d+(?:\.\d+)?)%$/);
      if (!model || !pair) throw new Error('Invalid acceptance result for ' + model);
      return { model, setting: r.Speed.trim() || undefined, score: Number(pair[2]), metrics: { accepted: Number(pair[1]) } };
    });
  },
};
export default board;

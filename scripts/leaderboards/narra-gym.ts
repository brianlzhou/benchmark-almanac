// NARRA-Gym ranks models by their mean across eleven narrative dimensions. The preliminary HTML table also gives two group averages.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://narra-gym.github.io/index.html#leaderboard";
const board: Leaderboard = {
  benchmark: "narra-gym",
  url: "https://narra-gym.github.io/index.html#leaderboard",
  feed,
  terms: "The preliminary website scores differ from Table 1 in the paper. Keep the two sources separate. The page lists no score reuse terms. The page host returns 404 for robots.txt.",
  aliases: { 'Qwen3.5-397B': 'qwen3-5-397b-a17b' },
  parts: {"StoryQ":"Story Quality","UX":"Overall User Experience","Rel":"Relevance","Coh":"Coherence","Emp":"Empathy","Sur":"Surprise","Eng":"Engagement","Cpx":"Complexity","Char":"Character Shaping","Sat":"Satisfaction","PQual":"Perceived Quality","Help":"Procedural Helpfulness","Reuse":"Reuse Intent"},
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'Aggregates');
    const keys = Object.keys(board.parts!);
    if (!table || table[1].map(c => c.text).join('|') !== keys.join('|')) throw new Error('Missing NARRA-Gym dimensions');
    const rows = table.slice(2).filter(c => c.length > 1).map(c => {
      if (c.length !== keys.length + 1 || c.slice(1).some(v => !v.text || !Number.isFinite(Number(v.text)))) throw new Error('Incomplete narrative result');
      const values = c.slice(1).map(v => Number(v.text));
      return { model: c[0].text, score: values.slice(2).reduce((a,b) => a+b, 0) / 11,
        metrics: Object.fromEntries(keys.map((key,i) => [key,values[i]])) };
    });
    if (rows.length < 8) throw new Error('Missing models');
    return rows;
  },
};
export default board;

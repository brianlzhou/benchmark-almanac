// CoNLL 2018 ranks parsers by labeled attachment score. The results page lists the Ancient Greek PROIEL systems under their treebank heading.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://universaldependencies.org/conll18/results-las.html";


export async function conllLas(url: string, treebank: string): Promise<LeaderboardRow[]> {
  const html = await fetchText(url);
  const section = html.split('<h3 id="' + treebank + '">')[1]?.split('</pre>')[0].split('<pre>')[1];
  if (!section) throw new Error('Missing CoNLL standings for ' + treebank);
  const rows = section.trim().split(/\r?\n/).map(line => {
    const cells = line.trim().replace(/^\d+\.\s*/, '').split(/\t+/).map(s => s.trim());
    if (cells.length !== 3 || !cells[0] || !/^\d+(\.\d+)?$/.test(cells[2])) throw new Error('Invalid CoNLL result');
    return { model: cells[0], score: Number(cells[2]), setting: cells[1] };
  });
  if (rows.length < 26) throw new Error('Incomplete CoNLL standings for ' + treebank);
  return rows;
}

const board: Leaderboard = {
  benchmark: "ud-ancient-greek-proiel",
  url: "https://universaldependencies.org/conll18/results-las.html#grc_proiel",
  feed,
  terms: "The organizers publish the scores in HTML and give no separate license for that table. https://universaldependencies.org/conll18/results-las.html The feed host returns no robots.txt.",
  async fetch() {
    return conllLas(feed, 'grc_proiel');
  },
};
export default board;

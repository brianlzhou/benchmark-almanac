// CoNLL 2018 ranks parsers by labeled attachment score. The results page lists the Ancient Greek PROIEL systems under their treebank heading.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://universaldependencies.org/conll18/results-las.html";

export const CONLL18_STATS: NonNullable<Leaderboard['stats']> = {
  mlas: { name: 'Morphology-aware LAS (MLAS)', unit: '%', better: 'higher' },
  blex: { name: 'Bi-lexical dependency score (BLEX)', unit: '%', better: 'higher' },
  uas: { name: 'Unlabeled attachment score (UAS)', unit: '%', better: 'higher' },
};

const pageCache = new Map<string, Promise<string>>();
const cachedPage = (url: string) => {
  let p = pageCache.get(url);
  if (!p) {
    p = fetchText(url);
    pageCache.set(url, p);
  }
  return p;
};

function parseTreebank(html: string, treebank: string): [string, string, number][] {
  const section = html.split('<h3 id="' + treebank + '">')[1]?.split('</pre>')[0].split('<pre>')[1];
  if (!section) throw new Error('Missing CoNLL standings for ' + treebank);
  return section.trim().split(/\r?\n/).map(line => {
    const cells = line.trim().replace(/^\d+\.\s*/, '').split(/\t+/).map(s => s.trim());
    if (cells.length !== 3 || !cells[0] || !/^\d+(\.\d+)?$/.test(cells[2])) throw new Error('Invalid CoNLL result');
    return [cells[0], cells[1], Number(cells[2])];
  });
}

export async function conllLas(url: string, treebank: string): Promise<LeaderboardRow[]> {
  const base = url.replace(/[^/]+$/, '');
  const [lasHtml, mlasHtml, blexHtml, uasHtml] = await Promise.all([
    cachedPage(url),
    cachedPage(base + 'results-mlas.html'),
    cachedPage(base + 'results-blex.html'),
    cachedPage(base + 'results-uas.html'),
  ]);
  const byKey = (html: string) => new Map(parseTreebank(html, treebank).map(([m, s, v]) => [`${m}\t${s}`, v]));
  const mlas = byKey(mlasHtml), blex = byKey(blexHtml), uas = byKey(uasHtml);
  const rows = parseTreebank(lasHtml, treebank).map(([model, setting, score]) => {
    const k = `${model}\t${setting}`;
    const metrics: Record<string, number> = {};
    if (mlas.has(k)) metrics.mlas = mlas.get(k)!;
    if (blex.has(k)) metrics.blex = blex.get(k)!;
    if (uas.has(k)) metrics.uas = uas.get(k)!;
    return { model, score, setting, metrics: Object.keys(metrics).length ? metrics : undefined };
  });
  if (rows.length < 26) throw new Error('Incomplete CoNLL standings for ' + treebank);
  return rows;
}

const board: Leaderboard = {
  benchmark: "ud-ancient-greek-proiel",
  stats: CONLL18_STATS,
  url: "https://universaldependencies.org/conll18/results-las.html#grc_proiel",
  feed,
  terms: "The organizers publish the scores in HTML and give no separate license for that table. https://universaldependencies.org/conll18/results-las.html The feed host returns no robots.txt.",
  async fetch() {
    return conllLas(feed, 'grc_proiel');
  },
};
export default board;

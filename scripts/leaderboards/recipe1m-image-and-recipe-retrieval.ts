// Recipe1M evaluates image to recipe and recipe to image retrieval on the Recipe1M dataset.
// The paper reports no overall score, so the headline is im2recipe R@1, the first retrieval column in Table 2.
// This importer reads Table 2 from the authors' paper and keeps the reciprocal retrieval columns as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'http://pic2recipe.csail.mit.edu/im2recipe.pdf';
const board: Leaderboard = {
  benchmark: 'recipe1m-image-and-recipe-retrieval',
  static: 'paper',
  url: 'http://pic2recipe.csail.mit.edu/',
  feed: FEED,
  terms: 'The authors publish this paper and code publicly. Cite the Recipe1M authors and follow the source terms. http://pic2recipe.csail.mit.edu/',
  headline: 'The paper reports no overall score, so this is the im2recipe R@1 column, which it presents first.',
  parts: { im2recipeR1: 'im2recipe R@1', recipe2imR1: 'recipe2im R@1' },
  stats: { im2recipeR5: { name: 'im2recipe R@5', unit: '%', better: 'higher' }, im2recipeR10: { name: 'im2recipe R@10', unit: '%', better: 'higher' }, im2recipeMedianRank: { name: 'im2recipe median rank', unit: 'count', better: 'lower' }, recipe2imR5: { name: 'recipe2im R@5', unit: '%', better: 'higher' }, recipe2imR10: { name: 'recipe2im R@10', unit: '%', better: 'higher' }, recipe2imMedianRank: { name: 'recipe2im median rank', unit: 'count', better: 'lower' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(FEED);
    const table = paper.match(/random ranking[\s\S]*?joint emb\. \+ semantic[\s\S]*?Table 2:/)?.[0];
    if (!table) throw new Error('Recipe1M Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split('\n')) {
      const match = line.match(/^\s*(random ranking|CCA w\/ skip-thoughts \+ word2vec \(GoogleNews\) \+ image features|CCA w\/ skip-instructions \+ ingredient word2vec \+ image features|joint emb\. only|joint emb\. \+ semantic)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/);
      if (!match || match[1] === 'random ranking') continue;
      const [, model, imMedR, imR1, imR5, imR10, recMedR, recR1, recR5, recR10] = match;
      rows.push({ model, score: Number(imR1) * 100, metrics: { im2recipeR1: Number(imR1) * 100, im2recipeR5: Number(imR5) * 100, im2recipeR10: Number(imR10) * 100, im2recipeMedianRank: Number(imMedR), recipe2imR1: Number(recR1) * 100, recipe2imR5: Number(recR5) * 100, recipe2imR10: Number(recR10) * 100, recipe2imMedianRank: Number(recMedR) } });
    }
    return checked(rows, 4);
  },
};
export default board;

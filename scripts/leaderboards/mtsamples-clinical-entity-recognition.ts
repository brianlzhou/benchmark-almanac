// MTSamples clinical entity recognition tests extraction of medical entities from clinical text.
// Table 4 reports MTSamples exact and relaxed-match F1 for GPT-3.5 and GPT-4 with three prompt settings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11339492/';
const feed = 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11339492/fullTextXML';

const board: Leaderboard = {
  benchmark: 'mtsamples-clinical-entity-recognition',
  url,
  feed,
  static: 'paper',
  terms: 'The article is publicly available through PubMed Central and Europe PMC. https://pmc.ncbi.nlm.nih.gov/about/copyright/',
  stats: { exactF1: { name: 'Exact-match F1', unit: '%', better: 'higher' } },
  async fetch() {
    const xml = await fetchText(feed);
    const table4 = xml.match(/<table-wrap\b[^>]*id="ocad259-T4"[\s\S]*?<\/table-wrap>/)?.[0];
    if (!table4 || !table4.includes('0.593') || !table4.includes('0.861') || !table4.includes('0.493')) {
      throw new Error('Missing MTSamples Table 4');
    }
    return checked([
      { model: 'GPT-3.5-turbo-0301', setting: 'zero-shot, all prompt components', score: 71.9, metrics: { exactF1: 43.6 } },
      { model: 'GPT-3.5-turbo-0301', setting: '1-shot, all prompt components', score: 77.9, metrics: { exactF1: 46.8 } },
      { model: 'GPT-3.5-turbo-0301', setting: '5-shot, all prompt components', score: 79.4, metrics: { exactF1: 49.3 } },
      { model: 'GPT-4-0314', setting: 'zero-shot, all prompt components', score: 83.8, metrics: { exactF1: 52.6 } },
      { model: 'GPT-4-0314', setting: '1-shot, all prompt components', score: 84.9, metrics: { exactF1: 53.2 } },
      { model: 'GPT-4-0314', setting: '5-shot, all prompt components', score: 86.1, metrics: { exactF1: 59.3 } },
    ], 6);
  },
};
export default board;

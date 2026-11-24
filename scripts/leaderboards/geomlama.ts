// The source reports no overall score. The headline is the plain mean of the 25 parts, computed by this importer.
// GeoMLAMA tests local knowledge in five languages and five countries. Tables 8 to 13 give accuracy for each combination.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2022.emnlp-main.132.pdf';
const countries = ['US','China','India','Iran','Kenya'];
const board: Leaderboard = {
  benchmark: 'geomlama', url: 'https://aclanthology.org/2022.emnlp-main.132/', feed, static: 'paper',
  terms: 'The publisher links the paper and its terms at https://aclanthology.org/2022.emnlp-main.132/.',
  headline: 'The paper reports no overall score, so this is the plain mean of all 25 language and country accuracies.',
  parts: {},
  async fetch() {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const match of paper.matchAll(/Languages\s+Countries[ \t]+([^\n]+)\n([\s\S]*?)\n\s*Table (8|9|10|11|12|13): Results \(%\)/g)) {
      // Only the last header before a caption belongs to its table.
      const headers = [...match[0].matchAll(/Languages\s+Countries[ \t]+([^\n]+)\n/g)];
      const header = headers.at(-1)!;
      const models = header[1].trim().split(/\s+/);
      const lines = match[0].slice(header.index!+header[0].length).trim().split(/\n\s*Table /)[0].trim().split('\n');
      if (lines.length !== 25) throw new Error('Expected 25 country and language combinations');
      const settings = Number(match[3]) < 11 ? 'With country tokens' : 'Without country tokens';
      const results = models.map(model => ({ model, setting: settings, score: 0, metrics: {} as Record<string,number> }));
      for (let start = 0; start < 25; start += 5) {
        const block = lines.slice(start,start+5).map(line => line.trim().split(/\s+/));
        const lang = block[2].shift();
        if (!lang || !['en','zh','fa','hi','sw'].includes(lang)) throw new Error('Unknown prompt language');
        for (const [i,line] of block.entries()) {
          if (line.shift() !== countries[i] || line.length !== models.length) throw new Error('Unexpected country or width');
          const key = lang + ' ' + countries[i];
          board.parts![key] = { name: countries[i], group: lang };
          line.forEach((v,j) => {
            if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid GeoMLAMA accuracy');
            results[j].metrics[key] = Number(v);
          });
        }
      }
      for (const r of results) {
        if (Object.keys(r.metrics).length !== 25) throw new Error('Incomplete GeoMLAMA grid');
        r.score = Object.values(r.metrics).reduce((x,y) => x+y,0)/25;
        rows.push(r);
      }
    }
    return checked(rows,22);
  },
};
export default board;

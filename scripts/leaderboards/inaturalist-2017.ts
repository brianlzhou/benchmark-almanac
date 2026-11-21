// iNaturalist 2017 tests species classification. Table 3 reports private test top-1 accuracy.
// Table 4 also breaks down public test accuracy by super-class for IncResNetV2 SE.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content_cvpr_2018/papers/Van_Horn_The_INaturalist_Species_CVPR_2018_paper.pdf';
const board: Leaderboard = {
  benchmark: 'inaturalist-2017', static: 'paper', url: 'https://github.com/visipedia/inat_comp/tree/master/2017', feed,
  stats: { validationTop5: { name: 'Validation top-5 accuracy', unit: '%', better: 'higher' }, publicTestTop5: { name: 'Public test top-5 accuracy', unit: '%', better: 'higher' }, top5: { name: 'Private test top-5 accuracy', unit: '%', better: 'higher' } },
  terms: 'The Computer Vision Foundation provides open access to the paper at https://openaccess.thecvf.com/CVPR2018.',
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.match(/Validation\s+Public Test\s+Private Test\s+Top1\s+Top5\s+Top1\s+Top5\s+Top1\s+Top5([\s\S]+?)Table 3\. Classification results/);
    const breakdown = pdf.match(/Super-Class\s+Avg Train\s+Public Test[\s\S]+?Table 4\. Super-class level accuracy/);
    if (!table || !breakdown) throw new Error('Missing iNaturalist classification table');
    const parts: Record<string, string> = { validation: 'Validation', publicTest: 'Public Test' };
    const categories: Record<string, number> = {};
    for (const match of breakdown[0].matchAll(/ {2,}([A-Za-z]+)\s+[\d.]+ +([\d.]+) +([\d.]+) *$/gm)) {
      parts[match[1]] = 'Public Test: ' + match[1];
      categories[match[1]] = Number(match[2]);
      categories[match[1] + ' top5'] = Number(match[3]);
    }
    if (Object.keys(categories).length !== 26) throw new Error('Missing public test super-classes');
    board.parts = parts;
    const rows = [...table[1].matchAll(/ {2,}([\w]+(?: (?:SE|drp|V1))?) {2,}([\d.]+(?: +[\d.]+){5}) *$/gm)].map(m => {
      const [validation, validationTop5, publicTest, publicTestTop5, score, top5] = m[2].split(/\s+/).map(Number);
      return { model: m[1], score, metrics: { validation, validationTop5, publicTest, publicTestTop5, top5, ...(m[1] === 'IncResNetV2 SE' ? categories : {}) } };
    });
    return checked(rows, 9);
  },
};
export default board;

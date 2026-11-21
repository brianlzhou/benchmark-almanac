// TongGuOCR compares recognition accuracy on M5HisDoc in its paper.
// The first column reports accuracy rate. The remaining columns report recognition and reading-order measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://arxiv.org/pdf/2608.07917";


export async function recognitionTable(feed:string, pageNumber:number, caption:string, minimum:number):Promise<LeaderboardRow[]> {
    const page = (await pdfText(feed)).split('\f')[pageNumber-1];
    const header = /AR↑\s+CR↑\s+NED↓\s+F1↑\s+P↑\s+R↑\s+BLEU↑\s+RO-ED↓/.exec(page);
    if (!header || !page.includes(caption)) throw new Error('Missing paper table');
    const rows: LeaderboardRow[] = [];
    for (const line of page.slice(header.index).split('\n')) {
      const match = /^\s*(.+?)\s+(?:\[\d+\](∗)?†?\s+.*?|This work)\s+((?:-?\d+\.\d+|-)\s+(?:-?\d+\.\d+|-)(?:\s+(?:-?\d+\.\d+|-)){6})\s*$/.exec(line);
      if (!match) continue;
      const [score, ...rest] = match[3].trim().split(/\s+/);
      const metrics: Record<string,number> = {};
      ['CR','NED','F1','P','R','BLEU','RO-ED'].forEach((key,i) => {
        if (rest[i] !== '-') metrics[key] = Number(rest[i]);
      });
      rows.push({model:match[1], score:Number(score), setting:match[2] ? 'Text-line recognition' : 'Page recognition', metrics});
    }
    if (rows.length < minimum) throw new Error('Incomplete paper table');
    return rows;
}

const board: Leaderboard = {
  benchmark: "m5hisdoc", static: 'paper',
  url: "https://arxiv.org/pdf/2608.07917#page=13",
  feed,
  terms: "Table 4 includes seven cropped-line baselines. The paper gives no separate reuse license for its table. https://arxiv.org/pdf/2608.07917#page=13 arXiv permits PDF access and requests a 15-second crawl delay.",
  host: 'TongGuOCR',
  stats: { CR: { name: 'Character recognition rate', unit: '%', better: 'higher' }, NED: { name: 'Normalized edit distance', unit: '%', better: 'lower' }, F1: { name: 'F1 score', unit: '%', better: 'higher' }, P: { name: 'Precision', unit: '%', better: 'higher' }, R: { name: 'Recall', unit: '%', better: 'higher' }, BLEU: { name: 'BLEU', unit: '%', better: 'higher' }, 'RO-ED': { name: 'Reading-order edit distance', unit: '%', better: 'lower' } },
  fetch: () => recognitionTable(feed,13,'Table 4: Performance comparison',34),
};
export default board;

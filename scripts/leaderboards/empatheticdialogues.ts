// EmpatheticDialogues tests replies to personal stories about emotions. Table 2 reports human ratings
// from 1 to 5 for empathy, relevance and fluency. The authors call empathy the subscore of most interest.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const url = 'https://aclanthology.org/P19-1534/';
const feed = 'https://aclanthology.org/P19-1534.pdf';
const board: Leaderboard = {
  benchmark:'empatheticdialogues', static:'paper', url, feed, terms:'ACL Anthology publication terms apply. https://aclanthology.org/faq/copyright/',
  parts: { relevance:'Relevance', fluency:'Fluency' },
  stats: { empathy: { name: 'Empathy', unit: 'score', better: 'higher', note: 'Human rating on a 1 to 5 scale.' } },
  async fetch() {
    const paper = await pdfText(feed);
    const section = paper.match(/Model\s+Candidate\s+Empathy\s+Relevance\s+Fluency\n([\s\S]*?)\n\s*Gold Response/);
    if (!section || !paper.includes('Table 2: Human ratings.')) throw Error('Missing human ratings');
    const lines = section[1].trimEnd().split('\n');
    const rows: LeaderboardRow[] = [];
    let start = 0;
    for (const [model, n] of [['Retrieval',6],['Retrieval w/ BERT',6],['Generative',4]] as const) {
      const group = lines.slice(start,start+n);
      if (!group.some(l => l.trimStart().startsWith(model + ' '))) throw Error('Missing ' + model);
      start += n;
      let training = '';
      for (const line of group) {
        const fields = line.slice(25).trim().split(/\s{2,}/);
        if (fields.length === 5) training = fields.shift()!;
        if (!training || fields.length !== 4) throw Error('Unexpected human rating: ' + line);
        const [candidate, ...cells] = fields;
        const metrics: Record<string,number> = {};
        for (const [index,key] of ['empathy','relevance','fluency'].entries()) {
          const pair = cells[index].match(/^(\d+\.\d+) ± (\d+\.\d+)$/);
          if (!pair) throw Error('Missing rating or uncertainty');
          metrics[key] = Number(pair[1]);
          metrics[key === 'empathy' ? 'stderr' : key + 'Stderr'] = Number(pair[2]);
        }
        rows.push({ model, setting: training + (candidate === '–' ? '' : ', ' + candidate + ' candidates'), score:metrics.empathy, metrics });
      }
    }
    return checked(rows,16);
  },
};
export default board;

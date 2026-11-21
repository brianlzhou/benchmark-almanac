// The source reports no overall score. The headline is the plain mean of the seven parts, computed by this importer.
// MLQA tests multilingual extractive question answering. Table 5 gives F1 and exact match for
// same-language questions and contexts. Four configurations lack results for at least one language.
import type { BoardPart, Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2020.acl-main.653.pdf';
const languages = ['English','Spanish','German','Arabic','Hindi','Vietnamese','Chinese'];
const parts: Record<string,BoardPart> = {};
for (const language of languages) {
  for (const name of ['F1','Exact match']) parts[language + ' ' + name] = {name,group:language,unit:'%'};
}
const board: Leaderboard = {
  benchmark:'mlqa', static:'paper', url:'https://aclanthology.org/2020.acl-main.653/', feed,
  terms:'ACL Anthology copyright and licensing terms. https://aclanthology.org/faq/copyright/',
  parts, headline:'The headline averages token F1 equally across the seven MLQA test languages.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/F1 \/ EM\s+en\s+es\s+de\s+ar\s+hi\s+vi\s+zh\s*\n([\s\S]*?)Table 5: F1 score/);
    if (!table) throw new Error('Missing MLQA cross-lingual transfer table');
    const rows = table[1].trim().split('\n').filter(line => line.trim()).flatMap(line => {
      const cells = line.trim().split(/\s{2,}/);
      if (cells.length !== 8) throw new Error('Invalid MLQA language columns');
      const [model,...scores] = cells;
      if (scores.includes('-')) return [];
      const metrics: Record<string,number> = {};
      let total = 0;
      scores.forEach((s,i) => {
        const m = s.match(/^(\d+\.\d+) \/ (\d+\.\d+)$/);
        if (!m) throw new Error('Invalid F1 and exact match');
        total += Number(m[1]);
        metrics[languages[i] + ' F1'] = Number(m[1]);
        metrics[languages[i] + ' Exact match'] = Number(m[2]);
      });
      return [{model,setting:'Zero-shot cross-lingual transfer',score:total/languages.length,metrics}];
    });
    return checked(rows,2);
  },
};
export default board;

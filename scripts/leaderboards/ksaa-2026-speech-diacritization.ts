// KSAA ranks Arabic speech diacritization systems by word error including unmarked characters and case endings.
// Table 3 in the organizers' report gives three errors under each of four scoring conditions.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.osact-1.28.pdf";
const board: Leaderboard = {
  benchmark: "ksaa-2026-speech-diacritization", static: 'paper',
  url: "https://www.codabench.org/competitions/11859/",
  feed,
  terms: "Table 3 reports five team systems and three baselines. ACL Anthology lists CC BY 4.0. ACL Anthology returned 404 for robots.txt.",
  stats: {
    includedCaseDER: { name: 'Diacritization error rate, case endings included', unit: '%', better: 'lower' },
    includedCaseWER: { name: 'Word error rate, case endings included', unit: '%', better: 'lower' },
    includedCaseSER: { name: 'Sentence error rate, case endings included', unit: '%', better: 'lower' },
    includedNoCaseDER: { name: 'Diacritization error rate, case endings omitted', unit: '%', better: 'lower' },
    includedNoCaseWER: { name: 'Word error rate, case endings omitted', unit: '%', better: 'lower' },
    includedNoCaseSER: { name: 'Sentence error rate, case endings omitted', unit: '%', better: 'lower' },
    excludedCaseDER: { name: 'Diacritization error rate, no-diacritic chars excluded', unit: '%', better: 'lower' },
    excludedCaseWER: { name: 'Word error rate, no-diacritic chars excluded', unit: '%', better: 'lower' },
    excludedCaseSER: { name: 'Sentence error rate, no-diacritic chars excluded', unit: '%', better: 'lower' },
    excludedNoCaseDER: { name: 'Diacritization error rate, both exclusions', unit: '%', better: 'lower' },
    excludedNoCaseWER: { name: 'Word error rate, both exclusions', unit: '%', better: 'lower' },
    excludedNoCaseSER: { name: 'Sentence error rate, both exclusions', unit: '%', better: 'lower' },
  },
  async fetch() {
    const doc = await pdfText(feed);
    const end = doc.indexOf('Table 3: Test set results for participant systems');
    const start = doc.lastIndexOf('Including no diacritics', end);
    const section = doc.slice(start, end);
    if (!section.includes('Excluding no diacritics') || section.match(/\*DER/g)?.length !== 4) throw new Error('Missing KSAA scoring conditions');
    const keys = ['includedCase', 'includedNoCase', 'excludedCase', 'excludedNoCase'].flatMap(k => ['DER', 'WER', 'SER'].map(m => k + m));
    const rows = section.split('\n').filter(line => /\d+\.\d+\s*$/.test(line)).map(line => {
      const [label, ...cells] = line.trim().split(/\s{2,}/);
      if (!label || cells.length !== 12 || !cells.every(v => Number.isFinite(Number(v)))) throw new Error('Invalid KSAA result');
      const model = label.replace(/^\*\*/, '');
      return { model, score: Number(cells[1]), setting: label.startsWith('**') ? 'Organizer baseline' : undefined,
        metrics: Object.fromEntries(keys.map((k, i) => [k, Number(cells[i])])) };
    });
    if (rows.length < 8) throw new Error('Missing KSAA submissions');
    return rows;
  },
};
export default board;

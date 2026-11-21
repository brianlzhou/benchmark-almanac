// The 2013 shared task identified writers' native languages from English essays. Tables 3 to 5
// report overall accuracy and eleven language F1 scores. Table 7 identifies classifiers by team.
// Only teams with a single classifier entry in that table can be attributed to a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/W13-1706.pdf';
const languages = ['ARA', 'CHI', 'FRE', 'GER', 'HIN', 'ITA', 'JPN', 'KOR', 'SPA', 'TEL', 'TUR'];
const board: Leaderboard = {
  benchmark: 'nli-shared-task-2013', feed, url: feed, static: 'paper',
  terms: 'ACL Anthology terms apply to the workshop paper. https://aclanthology.org/faq/copyright/',
  parts: Object.fromEntries(languages.map(lang => [lang, { name: lang, group: 'L1 F-score' }])),
  async fetch() {
    const paper = await pdfText(feed);
    const methods = paper.match(/Machine Learning\s+Teams\s*\n([\s\S]*?)Table 7: Machine Learning algorithms/);
    if (!methods) throw new Error('Missing teams and classifiers');
    const classifiers = new Map<string, string[]>();
    for (const line of methods[1].trim().split('\n')) {
      const match = line.trim().match(/^(.+?)\s{2,}([A-Z]+(?:, [A-Z]+)*)$/);
      if (!match) continue;
      for (const team of match[2].split(', ')) classifiers.set(team, [...classifiers.get(team) ?? [], match[1]]);
    }
    const header = 'Team\\s+Run\\s+Overall\\s+' + languages.join('\\s+') + '\\s+Name\\s+Acc\\.';
    const sections = paper.split(new RegExp(header));
    if (sections.length !== 4) throw new Error('Missing closed or open results');
    const rows: LeaderboardRow[] = [];
    for (const [index, section] of sections.slice(1).entries()) {
      const table = section.split('Table ' + (index + 3) + ': Results for')[0];
      for (const line of table.trim().split('\n')) {
        const [submitter, run, ...cells] = line.trim().split(/\s+/);
        const methods = classifiers.get(submitter);
        if (methods?.length !== 1) continue;
        if (cells.length !== 12 || !cells.every(c => /^0\.\d+$/.test(c))) throw new Error('Invalid result for ' + submitter);
        const percent = cells.map(c => Number((100 * Number(c)).toFixed(1)));
        rows.push({ model: methods[0], submitter, setting: ['Closed', 'Open-1', 'Open-2'][index] + ', ' + submitter + ' run ' + run,
          score: percent[0], metrics: Object.fromEntries(languages.map((key, i) => [key, percent[i + 1]])) });
      }
    }
    return checked(rows, 19);
  },
};
export default board;

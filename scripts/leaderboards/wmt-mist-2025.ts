// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Table 5 converts the four multilingual instruction tasks to percentile rankings, with 100% for first place.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.wmt-1.23.pdf';
const keys = ['LR','MT','OEG','XLSum'];
export default {
  benchmark: 'wmt-mist-2025', url: 'https://aclanthology.org/2025.wmt-1.23/', feed, static: 'paper',
  terms: 'ACL Anthology publishes the organizers’ paper at https://aclanthology.org/2025.wmt-1.23/',
  headline: 'The paper reports no overall score. This is the plain mean of its four subtask percentile ranks, with 100 for first place.',
  parts: Object.fromEntries(keys.map(name => [name,{ name, unit: '%' as const }])),
  aliases: { 'Claude 4': 'claude-sonnet-4', CommandA: 'cohere-command-a', 'AyaExpanse 32B': 'aya-expanse-32b',
    'AyaExpanse 8B': 'aya-expanse-8b', 'Qwen3 235B': 'qwen3-235b-a22b' },
  async fetch() {
    const page = await pdfText(feed);
    const heading = page.match(/Model\s+LR\s+MT\s+OEG\s+XLSum/);
    if (!heading) throw new Error('Table 5 headings missing');
    const start = heading.index!;
    const offset = start - page.lastIndexOf('\n',start) - 1 - (page.slice(page.lastIndexOf('\n',start)+1,start).startsWith('\f') ? 1 : 0);
    const lines = page.slice(start + heading[0].length).split('Table 5: Aggregate results')[0].split('\n');
    const rows: LeaderboardRow[] = [];
    for (const line of lines) {
      const rhs = line.slice(offset).trim();
      if (!rhs) continue;
      const cells = rhs.match(/^(.+?)\s+(\d+%|-)\s+(\d+%|-)\s+(\d+%|-)\s+(\d+%|-)$/);
      if (!cells) throw new Error('Unexpected Table 5 row ' + rhs);
      if (cells.slice(2).includes('-')) continue;
      const values = cells.slice(2).map(parseFloat);
      rows.push({ model: cells[1], score: values.reduce((a,b) => a+b)/4,
        metrics: Object.fromEntries(keys.map((k,i) => [k,values[i]])) });
    }
    return checked(rows,15);
  },
} satisfies Leaderboard;

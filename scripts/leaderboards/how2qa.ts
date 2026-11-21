// How2QA tests multiple-choice question answering on instructional videos.
// The VALUE QA leaderboard reports accuracy on the How2QA test set.
// Its JSONL feed also contains entries submitted only for other tasks.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://value-benchmark.github.io/data/leaderboard_score.jsonl';
export default {
  benchmark: 'how2qa', url: 'https://value-benchmark.github.io/leaderboard.html', feed,
  host: 'VALUE',
  terms: 'VALUE data terms at https://github.com/VALUE-Leaderboard/DataRelease/blob/main/DATA.md#license',
  async fetch() {
    const entries = (await fetchText(feed)).trim().split(/\r?\n/).map(line => JSON.parse(line));
    return checked(entries.filter(r => r.qa_leaderboard).flatMap(r => {
      const [name, config] = r.model.split(/<br\s*\/?\s*>/i);
      const model = text(name);
      if (model === r['codaLab username']) return [];
      const setting = config ? text(config).replace(/^\((.*)\)$/, '$1') : undefined;
      const [month, day, year] = r.date.split('/');
      return [{model, setting, score: r.how2qa, date: [year, month, day].join('-'),
        submitter: r.institution, link: r.paper_link || undefined}];
    }), 5);
  },
} satisfies Leaderboard;

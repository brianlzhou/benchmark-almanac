// ATM-Bench measures how well a system answers questions about a person's history.
// The default ATM-Bench table ranks systems by QS. Its rows are embedded in the leaderboard page.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const page = 'https://atmbench.github.io/leaderboard.html';
const board: Leaderboard = {
  benchmark: 'atm-bench',
  url: page,
  feed: page,
  terms: 'The project page credits its content under CC BY-SA 4.0.',
  harnesses: 'system',
  stats: { recallAt10:{name:'Recall@10',unit:'%',better:'higher'}, indexHours:{name:'Indexing time',unit:'hours',better:'lower'} },
  aliases: { 'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025' },
  async fetch() {
    const html = await fetchText(page);
    const body = html.match(/id: 'atm-bench',[\s\S]*?rows:\s*\[([\s\S]*?)\n\s*\]/)?.[1];
    if (!body) throw new Error('ATM-Bench table missing');
    const records = body.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    if (records.length < 30) throw new Error('ATM-Bench rows missing');
    return records.map(line => {
      const field = (key: string) => line.match(new RegExp(`\\b${key}:\\s*'([^']+)'`))?.[1];
      const numeric = (key: string) => {
        const value = line.match(new RegExp(`\\b${key}:\\s*(null|[\\d.]+)`))?.[1];
        if (!value) throw new Error(`ATM-Bench missing ${key}`);
        return value === 'null' ? undefined : Number(value);
      };
      const model = field('answer_model');
      const type = field('type');
      const harness = field('harness');
      const score = numeric('qs');
      if (!model || !type || !harness || score === undefined) throw new Error('Incomplete ATM-Bench row');
      const recall = numeric('recall');
      const hours = numeric('index_time');
      const setting = [type, field('memory_model'), field('retriever')].filter(Boolean).join(' / ');
      return { model, score, setting, harness: harness === '-' ? undefined : harness, link: field('link'),
        metrics: { ...(recall === undefined ? {} : { recallAt10: recall }), ...(hours === undefined ? {} : { indexHours: hours }) } };
    });
  },
};
export default board;

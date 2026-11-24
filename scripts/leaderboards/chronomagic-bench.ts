// ChronoMagic-Bench evaluates time-lapse video generation. Its full benchmark tab ranks models by MTScore.
// The Hugging Face Space reads the full benchmark CSV and displays four other video metrics alongside MTScore.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/BestWishYsh/ChronoMagic-Bench';
const feed = url + '/raw/main/file/results_ChronoMagic-Bench.csv';
const columns = ['UMT-FVD↓', 'UMTScore↑', 'MTScore↑', 'CHScore↑', 'GPT4o-MTScore↑'];
const statKeys: Record<string, string> = {
  'UMT-FVD↓': 'umtFvd',
  'UMTScore↑': 'umtScore',
  'GPT4o-MTScore↑': 'gpt4oMtScore',
  'CHScore↑': 'chScore',
};
const board: Leaderboard = {
  benchmark: 'chronomagic-bench', url, feed,
  terms: 'The authors publish their leaderboard Space under Apache 2.0.',
  stats: {
    umtFvd: { name: 'Unmasked Teacher Fréchet video distance', unit: 'score', better: 'lower' },
    umtScore: { name: 'Unmasked Teacher score', unit: 'score', better: 'higher' },
    gpt4oMtScore: { name: 'GPT-4o metamorphic score', unit: 'score', better: 'higher' },
    chScore: { name: 'ChronoMagic score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    if (records.length < 14) throw new Error('Incomplete ChronoMagic-Bench table');
    return records.map(r => {
      const name = r.Model?.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (!r.Model || !columns.every(k => r[k]?.trim() && Number.isFinite(Number(r[k])))) throw new Error('Missing ChronoMagic-Bench result');
      const metrics = Object.fromEntries(Object.entries(statKeys).map(([col, key]) => [key, Number(r[col])]));
      return { model: name?.[1] ?? r.Model, link: name?.[2], score: Number(r['MTScore↑']), metrics };
    });
  },
};
export default board;

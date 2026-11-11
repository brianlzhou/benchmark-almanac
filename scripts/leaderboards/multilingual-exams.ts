// Multilingual Exams: Qwen's release report publishes Multi-Exam accuracy in its base-model tables.
// Read the Multi-Exam row across model columns, as percentages. Base models stay distinct from chat models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://qwenlm.github.io/blog/qwen2.5-llm/';
const SOURCES = [{url: FEED, release: 'Qwen2.5'}, {url: 'https://qwenlm.github.io/blog/qwen2/', release: 'Qwen2'}];
const board: Leaderboard = {
  benchmark: 'multilingual-exams', url: FEED, feed: FEED,
  terms: 'Public Qwen release-report tables, attributed to the Qwen authors; no separate results license is stated.',
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const source of SOURCES) for (const t of tables(await fetchText(source.url))) {
      const scores = t.find(r => r[0]?.text === 'Multi-Exam');
      if (!scores) continue;
      for (let i = 1; i < scores.length; i++) {
        const score = num(scores[i].text), model = t[0]?.[i]?.text;
        if (model && score !== undefined) rows.push({model: `${model} (base)`, score, setting: `base model; ${source.release} release evaluation`});
      }
    }
    // Qwen1.5 publishes the same exam category vertically in its base-model section.
    const early = tables(await fetchText('https://qwenlm.github.io/blog/qwen1.5/')).find(t => t[0]?.[0]?.text === 'Models' && t[0]?.[1]?.text === 'Exams');
    if (!early) throw new Error('Qwen1.5 multilingual Exams table missing');
    for (const r of early.slice(1)) {
      const score = num(r[1]?.text), label = r[0]?.text;
      if (!label || score === undefined) continue;
      const api = /^GPT-/i.test(label);
      rows.push({model: api ? `${label} [snapshot unspecified]` : `${label} (base)`, score, setting: `${api ? 'API comparator' : 'base model'}; Qwen1.5 release evaluation; 5-shot exams`});
    }
    if (!rows.length) throw new Error('No Multi-Exam rows');
    return rows;
  },
};
export default board;

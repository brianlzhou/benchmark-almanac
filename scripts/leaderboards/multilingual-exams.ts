// Join model licenses and sizes from the release tables to the scored base models.
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
  stats: {
    nonEmbParamsB: { name: 'Non-embedding parameters', unit: 'billions' },
    layers: { name: 'Transformer layers', unit: 'count' },
    contextLengthK: { name: 'Context length', unit: 'thousands', note: 'Maximum context length in thousands of tokens.' },
    generationLengthK: { name: 'Generation length', unit: 'thousands', note: 'Maximum generation length in thousands of tokens.' },
    activeParamsB: { name: 'Active parameters', unit: 'billions' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const source of SOURCES) {
      const all = tables(await fetchText(source.url));
      const specs = all.find(t => t[0]?.some(c => c.text === 'License') && t[0]?.some(c => c.text === 'Params'));
      for (const t of all) {
        const scores = t.find(r => r[0]?.text === 'Multi-Exam');
        if (!scores) continue;
        const byLabel = (name: RegExp, col: number) => num(t.find(r => name.test(r[0]?.text ?? ''))?.[col]?.text);
        for (let i = 1; i < scores.length; i++) {
          const score = num(scores[i].text), model = t[0]?.[i]?.text;
          if (!model || score === undefined) continue;
          const spec = specs?.find(r => r[0]?.text === model);
          const value = (column: string) => spec?.[specs![0].findIndex(c => c.text === column)]?.text;
          const metrics: Record<string, number> = {};
          const fields = {
            nonEmbParamsB: num(value('Non-Emb Params')) ?? byLabel(/^#?\s*Non-emb Params$/i, i),
            activeParamsB: byLabel(/^#?\s*Activated Params$/i, i), layers: num(value('Layers')),
            contextLengthK: num(value('Context Length')), generationLengthK: num(value('Generation Length')),
          };
          for (const [key, n] of Object.entries(fields)) if (n !== undefined) metrics[key] = n;
          rows.push({model: `${model} (base)`, score, setting: `base model; ${source.release} release evaluation`,
            params: num(value('Params')) ?? byLabel(/^#?\s*Params$/i, i), license: value('License'), metrics});
        }
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

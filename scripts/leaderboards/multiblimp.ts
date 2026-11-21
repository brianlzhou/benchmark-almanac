// MultiBLiMP tests whether a model assigns higher probability to the grammatical sentence in a minimal pair.
// The authors define accuracy as "taking the mean over the pred column" in their results CSV.
// Stream that file to count correct predictions by model, language and agreement phenomenon.
import { Readable } from 'node:stream';
import { createInterface } from 'node:readline';
import type { Leaderboard, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://drive.usercontent.google.com/download?id=1meCW4AXKLXhOwMnFEV5QmbJnQhMqA0he&export=download&confirm=t';
const phenomena: Record<string, string> = {
  'SP-#': 'Subject-participle number', 'SP-P': 'Subject-participle person', 'SP-G': 'Subject-participle gender',
  'SV-#': 'Subject-verb number', 'SV-P': 'Subject-verb person', 'SV-G': 'Subject-verb gender',
};
type Count = { correct: number; total: number };
const pct = (count: Count) => 100 * count.correct / count.total;
const board: Leaderboard = {
  benchmark: 'multiblimp', url: 'https://github.com/jumelet/multiblimp#results', feed,
  terms: 'The authors release these results with attribution at https://github.com/jumelet/multiblimp#results.',
  aliases: { 'aya-32b': 'aya-expanse-32b', 'aya-8b': 'aya-expanse-8b', tulu3: 'llama-3-1-tulu-3-8b',
    'Llama3-1B': 'llama-3-2-1b', 'Llama3-3B': 'llama-3-2-3b',
    'OLMo-2-1B-it': 'olmo-2-1b-instruct', 'OLMo-2-32B-it': 'olmo-2-32b-instruct',
    ...Object.fromEntries([1,4,12,27].flatMap(n => [
      ['gemma3-' + n + 'b (base)', 'gemma-3-' + n + 'b-pt'], ['gemma3-' + n + 'b-it', 'gemma-3-' + n + 'b'],
    ])),
    ...Object.fromEntries(['0.6','1.7','4','8','14'].map(n => ['Qwen3-' + n + 'B-it', 'qwen3-' + n.replace('.', '-') + 'b'])),
    ...Object.fromEntries([4,8,14].map(n => ['Qwen3-' + n + 'B (base)', 'qwen3-' + n + 'b-base'])),
  },
  async fetch() {
    const response = await fetch(feed, { signal: AbortSignal.timeout(240_000) });
    if (!response.ok || !response.body) throw new Error('Cannot read MultiBLiMP CSV: ' + response.status);
    const lines = createInterface({ input: Readable.fromWeb(response.body as any), crlfDelay: Infinity });
    const models = new Map<string, { overall: Count; parts: Record<string,Count> }>();
    const parts: Record<string, BoardPart> = {};
    let width = 0;
    for await (const line of lines) {
      const cells = line.split(',');
      if (!width) {
        if (cells.slice(1,11).join(',') !== 'model,phenomenon,delta,pred,ppl,distance,abs_distance,asterisk,lang,language') {
          throw new Error('Unexpected MultiBLiMP columns');
        }
        width = cells.length;
        continue;
      }
      const [,model,phenomenon,,pred,,,,,code,language] = cells;
      if (cells.length !== width || !['True','False'].includes(pred) || !phenomena[phenomenon] || !/^[a-z]{3}$/.test(code)) {
        throw new Error('Malformed MultiBLiMP prediction');
      }
      if (model === 'Goldfish') continue; // Separate monolingual models cover only 70 languages.
      let counts = models.get(model);
      if (!counts) {
        counts = { overall: { correct: 0, total: 0 }, parts: {} };
        models.set(model, counts);
      }
      parts[code] ??= { name: language, group: 'Language' };
      parts[phenomenon] ??= { name: phenomena[phenomenon], group: 'Phenomenon' };
      for (const count of [counts.overall, ...[code, phenomenon].map(k => counts.parts[k] ??= {correct: 0,total: 0})]) {
        count.total++;
        if (pred === 'True') count.correct++;
      }
    }
    board.parts = parts;
    return checked([...models].map(([label, counts]) => {
      if (counts.overall.total !== 121305 || Object.keys(counts.parts).length !== 107) throw new Error('Incomplete predictions for ' + label);
      const model = /^(?:Qwen3|gemma3)-/i.test(label) && !label.endsWith('-it') ? label + ' (base)' : label;
      return { model, score: pct(counts.overall), metrics: Object.fromEntries(Object.entries(counts.parts).map(([k,c]) => [k, pct(c)])) };
    }), 42);
  },
};
export default board;

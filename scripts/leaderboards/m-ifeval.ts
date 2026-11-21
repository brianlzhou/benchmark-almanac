// M-IFEval measures instruction following in Spanish, French and Japanese. The README ranks models
// by its published average across these languages. English is the original IFEval comparison.
// The authors' evaluations directory identifies the snapshots and quantization behind the short names.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://github.com/lightblue-tech/M-IFEval';
const feed = 'https://raw.githubusercontent.com/lightblue-tech/M-IFEval/HEAD/README.md';
const snapshots: Record<string, string> = {
  o1: 'o1-preview-2024-09-12', 'o1 Mini': 'o1-mini-2024-09-12',
  Opus: 'claude-3-opus-20240229', Sonnet: 'claude-3-5-sonnet-20240620', Haiku: 'claude-3-haiku-20240307',
  GPT4o: 'gpt-4o-2024-08-06', 'GPT4o Mini': 'gpt-4o-mini-2024-07-18',
  'Llama 3.1 8B I.': 'Meta-Llama-3.1-8B-Instruct', 'Mistral 7B I.': 'Mistral-7B-Instruct-v0.3',
};
const board: Leaderboard = {
  benchmark: 'm-ifeval', url, feed, terms: 'Apache License 2.0 at ' + url + '/blob/main/LICENSE.txt.',
  parts: { spanish: 'Spanish', french: 'French', japanese: 'Japanese' },
  stats: {originalEnglish:{name:'Original English instruction-following evaluation',unit:'%',better:'higher'}},
  aliases: { 'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b', 'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
    'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet', 'o1-preview-2024-09-12': 'o1-preview',
    'o1-mini-2024-09-12': 'o1-mini', 'gpt-4o-2024-08-06': 'gpt-4o-aug-2024', 'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
    ...Object.fromEntries(['0.5','1.5','3','7','14','32'].map(size => ['Qwen2.5-' + size + 'B-Instruct', 'qwen2-5-' + size.replace('.', '-') + 'b'])) },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model Name|English|Spanish|French|Japanese|Average (ES/FR/JA)');
    if (!table) throw new Error('Missing M-IFEval language scores');
    return checked(table.slice(1).map(([label, ...cells]) => {
      const quant = label.match(/^Qwen 2\.5 ([\d.]+)B I\. 4-bit$/);
      const model = quant ? 'Qwen2.5-' + quant[1] + 'B-Instruct' : snapshots[label] ?? label;
      const setting = quant ? 'GPTQ Int4' : label === 'Llama 3.1 8B I.' ? 'AWQ Int4' : undefined;
      if (cells.length !== 5) throw new Error('Incomplete M-IFEval row');
      const [originalEnglish, spanish, french, japanese, score] = cells.map(v => numberCell(v));
      return { model, setting, score, metrics: { originalEnglish, spanish, french, japanese } };
    }), 17);
  },
};
export default board;

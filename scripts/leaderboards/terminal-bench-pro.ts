// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Terminal-Bench Pro tests terminal agents on 200 public and 200 private tasks. The leaderboard embeds both success rates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://alibaba.github.io/terminal-bench-pro/';
interface Entry { model: string; agent: string; size: string; public: string; private: string }
const board: Leaderboard = {
  benchmark: 'terminal-bench-pro', url, feed: url, parts: { public: 'Public set', private: 'Private set' },
  headline: 'The board reports no overall score, so the headline is the plain mean of its public and private success rates.',
  terms: 'Apache 2.0. https://github.com/alibaba/terminal-bench-pro/blob/main/LICENSE',
  aliases: {
    'Qwen3.5': 'qwen3-5-397b-a17b', 'Qwen3-Coder-480B-Instruct': 'qwen3-coder-480b-a35b',
    'Devstral-Small-2-24B-Instruct-2512': 'devstral-small-2', 'Doubao-Seed-1.8': 'seed-1-8',
    'Deepseek-V3.2-Special': 'deepseek-v3-2-speciale',
  },
  async fetch() {
    const data = jsonAfter<Entry[]>(await fetchText(url), 'const originalData =');
    const rows = data.map(e => {
      if (!e.model || !e.agent || ![e.public, e.private].every(x => typeof x === 'string' && /^\d+(\.\d+)?$/.test(x))) throw new Error('Changed model, agent or split score');
      const pub = Number(e.public), priv = Number(e.private);
      return { model: e.model, harness: e.agent, score: (pub + priv) / 2, metrics: { public: pub, private: priv },
        params: /^\d+(?:\.\d+)?B/.test(e.size) ? parseFloat(e.size) : undefined };
    });
    return checked(rows, 24);
  },
};
export default board;

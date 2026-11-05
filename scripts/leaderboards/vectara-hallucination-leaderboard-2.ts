// Vectara Hallucination Leaderboard, 2025 dataset (HHEM-2.3 on over 7,700 private articles). The board is
// the markdown table between LEADERBOARD_START and LEADERBOARD_END in the vectara/hallucination-leaderboard
// README: Hallucination Rate (the ranking, lower is better, and the score), Factual Consistency Rate,
// Answer Rate and average summary length. Model names are provider/model ids, some with the effort and a
// date stamp ("openai/gpt-5.2-low-2025-12-11"), which the shared resolver splits. The old-dataset board
// lives on a separate branch and is a different benchmark record. Answer Rate (0 to 100) and Average Summary
// Length (words) are kept as metrics.answerRate and metrics.summaryWords. Factual Consistency Rate is 100
// minus the score, so it is not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/vectara/hallucination-leaderboard/main/README.md';

const board: Leaderboard = {
  benchmark: 'vectara-hallucination-leaderboard-2',
  url: 'https://github.com/vectara/hallucination-leaderboard',
  feed: `${FEED} (table between the LEADERBOARD markers)`,
  terms: 'README table in the vectara/hallucination-leaderboard repository, licensed Apache-2.0.',
  aliases: {
    'meta-llama/Llama-3.3-70B-Instruct-Turbo': 'llama-3-3-70b-instruct',
    'meta-llama/Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
    'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8': 'llama-4-maverick',
    'google/gemma-3-4b-it': 'gemma-3-4b',
    'google/gemma-3-12b-it': 'gemma-3-12b',
    'google/gemma-3-27b-it': 'gemma-3-27b',
    'google/gemma-4-26b-a4b-it': 'gemma-4-26b-a4b',
    'mistralai/mistral-large-2411': 'mistral-large-2-nov-2024',
    'mistralai/mistral-3-large-2512': 'mistral-large-3',
    'mistralai/mistral-small-2501': 'mistral-small-3',
    'mistralai/mistral-medium-2508': 'mistral-medium-3-1',
    'mistralai/ministral-3b-2410': 'ministral-3b',
    'mistralai/ministral-8b-2410': 'ministral-8b',
    'amazon/nova-pro-v1:0': 'amazon-nova-pro',
    'amazon/nova-lite-v1:0': 'amazon-nova-lite',
    'amazon/nova-micro-v1:0': 'amazon-nova-micro',
    'CohereLabs/command-r-plus-08-2024': 'command-r-plus',
    'CohereLabs/command-a-03-2025': 'cohere-command-a',
    'MiniMaxAI/minimax-m2p1': 'minimax-m2-1',
    'MiniMaxAI/minimax-m2p5': 'minimax-m2-5',
    'MiniMaxAI/minimax-m2p7': 'minimax-m2-7',
    'zai-org/GLM-4.5-AIR-FP8': 'glm-4-5-air',
    'zai-org/glm-4p7': 'glm-4-7',
    'microsoft/Phi-4-mini-instruct': 'phi-4-mini',
    // keyed without the date stamp, which the resolver strips first
    'qwen3.5-flash': 'qwen-3-5-flash-hosted-35b-a3b',
    'qwen3.5-plus': 'qwen-3-5-plus-hosted-397b-a17b',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const start = md.indexOf('<!-- LEADERBOARD_START -->');
    const end = md.indexOf('<!-- LEADERBOARD_END -->');
    if (start < 0 || end < start) throw new Error('no LEADERBOARD markers in the Vectara README');
    const lines = md.slice(start, end).split('\n').filter((l) => l.startsWith('|'));
    const head = lines[0]?.split('|').slice(1, -1).map((c) => c.trim());
    if (head?.[0] !== 'Model' || head[1] !== 'Hallucination Rate') throw new Error(`unexpected Vectara header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const score = num(cells[1]);
      if (!cells[0] || score === undefined) continue;
      // "xai-org/grok-4-1-fast-non-reasoning": the resolver would read "reasoning" as the effort
      const off = cells[0].match(/^(.*)-non-reasoning$/);
      const answerRate = head[3] === 'Answer Rate' ? num(cells[3]) : undefined;
      const summaryWords = /^Average Summary Length/.test(head[4] ?? '') ? num(cells[4]) : undefined;
      const metrics = { ...(answerRate === undefined ? {} : { answerRate }), ...(summaryWords === undefined ? {} : { summaryWords }) };
      rows.push({ model: off ? off[1] : cells[0], setting: off ? 'non-reasoning' : undefined, score, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    return rows;
  },
};
export default board;

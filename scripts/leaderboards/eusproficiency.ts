// EusProficiency measures accuracy across 5,169 Basque exam questions.
// The authors publish five-shot accuracy and standard error for open models, and per-question outcomes for API models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://api.github.com/repos/hitz-zentroa/latxa/git/trees/main?recursive=1';
const raw = 'https://raw.githubusercontent.com/hitz-zentroa/latxa/main/';
const board: Leaderboard = {
  benchmark: 'eusproficiency', url: 'https://github.com/hitz-zentroa/latxa/tree/main/evaluation/results', feed,
  terms: 'The results repository uses MIT. https://github.com/hitz-zentroa/latxa/blob/main/LICENSE',
  stats: { inputTokens: { name: 'Input tokens', unit: 'tokens' }, totalTokens: { name: 'Total tokens', unit: 'tokens' } },
  aliases: { 'Llama-2-13b-hf': 'llama-2-13b', 'Llama-2-70b-hf': 'llama-2-70b', 'Llama-2-7b-hf': 'llama-2-7b',
    'gpt-4-0125-preview': 'gpt-4-turbo-jan-2024', 'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024', 'gpt-4-0613': 'gpt-4-jun-2023' },
  async fetch() {
    const tree = await fetchJson<{ truncated: boolean; tree: { path: string }[] }>(feed);
    if (tree.truncated) throw new Error('Incomplete Latxa results tree');
    const files = tree.tree.filter(f => f.path.startsWith('evaluation/results/') && /eus_proficiency(?:_test)?_5-shot\.jsonl?$/.test(f.path));
    const rows: LeaderboardRow[] = [];
    for (const { path } of files) {
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1050));
      const model = path.split('/').at(-2)!;
      const link = raw + path, setting = '5-shot';
      if (path.endsWith('.jsonl')) {
        const lines = (await fetchText(link)).trim().split(/\r?\n/);
        const ids = new Set<number>();
        let correct = 0, cost = 0, priced = 0, input = 0, output = 0;
        for (const line of lines) {
          const item = JSON.parse(line);
          if (typeof item.correct !== 'boolean' || ids.has(item.id) ||
              !Number.isFinite(item.response?.usage?.prompt_tokens) || !Number.isFinite(item.response?.usage?.completion_tokens)) {
            throw new Error('Incomplete EusProficiency API output');
          }
          ids.add(item.id);
          correct += Number(item.correct);
          if (Number.isFinite(item.cost)) { cost += item.cost; priced++; }
          input += item.response.usage.prompt_tokens;
          output += item.response.usage.completion_tokens;
        }
        if (ids.size !== 5169) throw new Error('Incomplete EusProficiency test split');
        rows.push({ model, setting, link, score: 100 * correct / ids.size, cost: priced === ids.size ? cost / ids.size : undefined, tokens: output / ids.size,
          metrics: { inputTokens: input / ids.size, outputTokens: output / ids.size, totalTokens: (input + output) / ids.size } });
      } else {
        const data = await fetchJson<{ results: { eus_proficiency: Record<string, number> } }>(link);
        const result = data.results?.eus_proficiency;
        if (!Number.isFinite(result?.['acc,none']) || !Number.isFinite(result?.['acc_stderr,none'])) throw new Error('Missing accuracy or standard error');
        rows.push({ model, setting, link, score: 100 * result['acc,none'], metrics: { stderr: 100 * result['acc_stderr,none'] } });
      }
    }
    return checked(rows, 18);
  },
};
export default board;

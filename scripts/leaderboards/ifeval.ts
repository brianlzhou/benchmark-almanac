// IFEval on HELM Capabilities (Stanford CRFM). The score is "IFEval - IFEval Strict Acc" in the Accuracy table of
// core_scenarios.json, times 100. HELM scores each prompt as the share of its instructions followed under the
// strict check, then averages over prompts. Labs more often report prompt-level strict accuracy, where a prompt
// counts only when every instruction is followed, so the rows carry that as their setting. Keep the counts and run links from the IFEval scenario table.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { HELM_ALIASES, HELM_BUCKET, HELM_TERMS, helmNewest } from './helm-capabilities.ts';

interface Cell {
  value: string | number;
  run_spec_names?: string[];
}
interface Table {
  header: Cell[];
  rows: Cell[][];
}

const SETTING = 'strict, share of instructions followed';

const board: Leaderboard = {
  benchmark: 'ifeval',
  host: 'Stanford HELM',
  url: 'https://crfm.stanford.edu/helm/capabilities/latest/#/leaderboard/ifeval',
  feed: `${HELM_BUCKET}/capabilities/benchmark_output/releases/<newest>/groups/ifeval.json`,
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  stats: { latency: { name: 'Observed inference time', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const release = await helmNewest('capabilities');
    const [table] = await fetchJson<Table[]>(`${HELM_BUCKET}/${release}groups/ifeval.json`);
    const headers = table.header.map((cell) => cell.value);
    const rows = table.rows.flatMap((cells) => {
      const value = (key: string) => cells[headers.indexOf(key)]?.value;
      const accuracy = value('IFEval Strict Acc');
      const spec = cells[0].run_spec_names?.[0];
      if (typeof accuracy !== 'number' || !spec) return [];
      const fullName = spec.match(/model=([^,]+)/)?.[1]?.replace(/^[\w-]+?_/, '') ?? String(cells[0].value);
      const thinking = fullName.match(/-thinking-(\d+k|disabled)$/);
      const effort = fullName.match(/-(low|medium|high)-reasoning-effort$/);
      const model = fullName.replace(/-thinking-(?:\d+k|disabled)$|-(?:low|medium|high)-reasoning-effort$/, '');
      const setting = [SETTING, thinking ? `thinking ${thinking[1]}` : effort?.[1]].filter(Boolean).join(', ');
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      const metrics: Record<string, number> = {};
      for (const [column, key] of [['Observed inference time (s)', 'latency'], ['# prompt tokens', 'inputTokens'],
        ['# eval', 'evalInstances'], ['# train', 'trainInstances'], ['truncated', 'truncated']]) {
        const n = value(column);
        if (typeof n === 'number') metrics[key] = n;
      }
      const tokens = value('# output tokens');
      return [{ model, setting, score: accuracy * 100, date: stamp && stamp.slice(1).join('-') || undefined,
        tokens: typeof tokens === 'number' ? tokens : undefined, metrics,
        link: `https://crfm.stanford.edu/helm/capabilities/${release.split('/').filter(Boolean).pop()}/#/runs/${encodeURIComponent(spec)}` }];
    });
    if (!rows.length) throw new Error('No IFEval strict accuracy rows');
    return rows;
  },
};
export default board;

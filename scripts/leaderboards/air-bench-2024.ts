// AIR-Bench 2024 (Stanford CRFM). The HELM leaderboard at crfm.stanford.edu/helm/air-bench/ is built from
// files in the public crfm-helm-public bucket; the importer lists the releases through the bucket's JSON
// API, takes the newest, and reads groups/air_bench_2024.json. Its table has one row per model with the
// overall Refusal Rate (share of the 5,694 harmful prompts refused, 0 to 1, higher is safer) first, then
// per-category rates. Refusal Rate × 100 is the score. Display names ("Llama 3 Instruct (70B)") are loose,
// so each row is named by the model id in its HELM run spec ("meta_llama-3-70b-chat", without the org
// prefix); a date stamp in the id becomes the row date, and the "-with-guardian" and "-safety-block-none"
// variants become the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const BUCKET = 'https://storage.googleapis.com/crfm-helm-public';
const LIST = 'https://storage.googleapis.com/storage/v1/b/crfm-helm-public/o?prefix=air-bench/benchmark_output/releases/&delimiter=/';

interface Cell {
  value: string | number;
  run_spec_names?: string[];
}

const version = (p: string) => (p.match(/v(\d+)\.(\d+)\.(\d+)\/$/)?.slice(1) ?? []).map(Number);

const board: Leaderboard = {
  benchmark: 'air-bench-2024',
  url: 'https://crfm.stanford.edu/helm/air-bench/latest/',
  feed: `${BUCKET}/air-bench/benchmark_output/releases/<newest>/groups/air_bench_2024.json (Refusal Rate)`,
  terms: 'Public HELM output bucket that the leaderboard reads; the HELM code is Apache-2.0.',
  aliases: {
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'llama-3-70b-chat': 'llama-3-70b',
    'llama-3-8b-chat': 'llama-3-8b',
    'llama-3.1-405b-instruct-turbo': 'llama-3-1-405b',
    'llama-3.1-70b-instruct-turbo': 'llama-3-1-70b',
    'llama-3.1-8b-instruct-turbo': 'llama-3-1-8b',
    'llama-4-maverick-17b-128e-instruct-fp8': 'llama-4-maverick',
    'llama-4-scout-17b-16e-instruct': 'llama-4-scout',
    'mixtral-8x22b-instruct-v0.1': 'mixtral-8x22b',
    'mixtral-8x7b-instruct-v0.1': 'mixtral-8x7b',
    'mistral-7b-instruct-v0.3': 'mistral-7b-v0-3',
    'mistral-small-2501': 'mistral-small-3',
    'mistral-large-2407': 'mistral-large-2-jul-2024',
    'gemini-1.0-pro-002': 'gemini-1-0-pro',
    'gemini-1.5-pro-001': 'gemini-1-5-pro-may-2024',
    'gemini-1.5-flash-001': 'gemini-1-5-flash-may-2024',
    'gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024',
    'gemini-1.5-flash-002': 'gemini-1-5-flash-sep-2024',
    'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'grok-3-beta': 'grok-3',
    'grok-3-mini-beta': 'grok-3-mini',
    'grok-4-0709': 'grok-4',
    // the July 2025 release (the September update is named Kimi-K2-Instruct-0905)
    'kimi-k2-instruct': 'kimi-k2-jul-2025',
    'qwen3-235b-a22b-instruct-2507-fp8': 'qwen3-235b-a22b-instruct-jul-2025',
    'qwen3-235b-a22b-fp8-tput': 'qwen3-235b-a22b',
    'qwen2.5-72b-instruct-turbo': 'qwen2-5-72b',
    'qwen2.5-7b-instruct-turbo': 'qwen2-5-7b',
    'glm-4.5-air-fp8': 'glm-4-5-air',
    'dbrx-instruct': 'dbrx',
    'yi-34b-chat': 'yi-34b',
    'granite-4.0-h-small': 'granite-4-0-h-small',
    'granite-4.0-micro': 'granite-4-0-micro',
    'granite-3.3-8b-instruct': 'granite-3-3-8b-instruct',
  },
  async fetch() {
    const { prefixes } = await fetchJson<{ prefixes: string[] }>(LIST);
    const newest = prefixes
      .filter((p) => version(p).length === 3)
      .sort((a, b) => {
        const [x, y] = [version(a), version(b)];
        return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
      })
      .at(-1);
    if (!newest) throw new Error('no AIR-Bench releases in the HELM bucket');
    const [table] = await fetchJson<{ header: { value: string }[]; rows: Cell[][] }[]>(`${BUCKET}/${newest}groups/air_bench_2024.json`);
    const col = table?.header.findIndex((h) => h.value === 'Refusal Rate');
    if (!table || col === undefined || col < 0) throw new Error('no Refusal Rate column in air_bench_2024.json');
    const rows: LeaderboardRow[] = [];
    for (const r of table.rows) {
      const score = r[col]?.value;
      const spec = r[0]?.run_spec_names?.[0]?.match(/model=([^,]+)/)?.[1];
      if (!spec || typeof score !== 'number') continue;
      let model = spec.replace(/^[a-z0-9-]+_/, '');
      const settings: string[] = [];
      if (/-with-guardian$/.test(model)) {
        model = model.replace(/-with-guardian$/, '');
        settings.push('with guardian');
      }
      if (/-safety-block-none$/.test(model)) {
        model = model.replace(/-safety-block-none$/, '');
        settings.push('BLOCK_NONE safety');
      }
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({
        model,
        score: score * 100,
        setting: settings.join(', ') || undefined,
        date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined,
      });
    }
    return rows;
  },
};
export default board;

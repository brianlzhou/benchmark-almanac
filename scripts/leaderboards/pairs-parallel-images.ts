// PAIRS tests demographic bias in judgments about people in parallel images.
// VHELM's PAIRS table reports prefix quasi-exact match across its twelve demographic and task groups.
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { HELM_BUCKET, helmNewest, HELM_ALIASES } from './helm-capabilities.ts';
import type { Leaderboard } from './types.ts';

type Cell = { value: string | number | null, run_spec_names?: string[] };
type Table = { title: string, header: Cell[], rows: Cell[][] };
const board: Leaderboard = {
  benchmark: 'pairs-parallel-images', host: 'VHELM', url: 'https://crfm.stanford.edu/helm/vhelm/latest/#/groups/pairs',
  feed: HELM_BUCKET + '/vhelm/benchmark_output/runs/<newest>/groups/pairs.json',
  terms: 'Stanford publishes VHELM under the license at https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  headline: 'VHELM reports the percentage of responses that match the prefix of a correct reference after light processing.',
  aliases: {...HELM_ALIASES, 'gemini-2.5-pro-exp-03-25': 'gemini-2-5-pro-mar-2025'}, parts: {},
  async fetch() {
    const suite = await helmNewest('vhelm', 'runs');
    const tables = await fetchJson<Table[]>(HELM_BUCKET + '/' + suite + 'groups/pairs.json');
    const group = tables.find(t => t.title === 'PAIRS');
    const subsets = tables.filter(t => t.title.startsWith('subset: '));
    if (!group || subsets.length !== 12 || [group, ...subsets].some(t => t.header[1]?.value !== 'PEM')) {
      throw new Error('Missing PAIRS PEM or subset');
    }
    const tokens = ['# prompt tokens', '# output tokens'].map(name => group.header.findIndex(c => c.value === name));
    if (tokens.includes(-1)) throw new Error('Missing VHELM token columns');
    const scores = subsets.map(t => {
      const key = t.title.slice(8);
      board.parts![key] = key.replace(', person: ', ': ').replaceAll('_', ' ');
      return {key, values: new Map(t.rows.map(c => [c[0].value, c[1].value]))};
    });
    const rows = group.rows.map(c => {
      const value = c[1].value;
      const modelId = c[1].run_spec_names?.[0]?.match(/model=[^_,]+_([^,]+)/)?.[1];
      if (typeof value !== 'number' || !modelId) throw new Error('Invalid VHELM result');
      const metrics: Record<string, number> = {};
      for (const {key, values} of scores) {
        const fraction = values.get(c[0].value);
        if (typeof fraction !== 'number') throw new Error('Missing ' + key + ' score for ' + modelId);
        metrics[key] = fraction * 100;
      }
      for (const [i, key] of ['inputTokens','outputTokens'].entries()) {
        const count = c[tokens[i]].value;
        if (typeof count === 'number') metrics[key] = count;
      }
      const suffix = modelId.match(/-(safety-block-none|high-reasoning-effort)$/)?.[1];
      const setting = suffix === 'safety-block-none' ? 'BLOCK_NONE safety' : suffix ? 'High reasoning effort' : undefined;
      return {model: suffix ? modelId.slice(0, -suffix.length - 1) : modelId, setting, score: 100 * value, metrics, tokens: metrics.outputTokens};
    });
    return checked(rows, 48);
  },
};
export default board;

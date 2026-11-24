import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { text, num } from '../html.ts';
// The v2 table's data attributes drive its Combined, Public and Held-out tabs. Each tab has its own
// pass@1, pass@4 and average per-rollout cost; never use combined costs for a subset.
export function cweV2(benchmark: string, subset: 'all' | 'public' | 'heldout'): Leaderboard {
  return {
    benchmark, url: 'https://cwe-bench.com/#leaderboard',
    feed: `https://cwe-bench.com/ (v2 ${subset} table data attributes)`,
    terms: 'Collinear AI publishes the public results and Apache-2.0 dataset; the Almanac credits and links the source.',
    ...(subset === 'all' ? {
      parts: {
        public: { name: 'Public set', note: 'Pass@1 on the public task subset.' },
        heldout: { name: 'Held-out set', note: 'Pass@1 on the private held-out task subset.' },
      },
    } : {}),
    stats: {
      passAt4: { name: 'Pass@4', unit: '%', better: 'higher', note: 'Share of tasks solved within four rollouts under the deterministic programmatic verifier.' },
      ...(subset === 'all' ? {
        publicPassAt4: { name: 'Public set Pass@4', unit: '%', better: 'higher' as const },
        heldoutPassAt4: { name: 'Held-out set Pass@4', unit: '%', better: 'higher' as const },
        publicCost: { name: 'Public set mean cost per rollout', unit: 'usd', better: 'lower' as const },
        heldoutCost: { name: 'Held-out set mean cost per rollout', unit: 'usd', better: 'lower' as const },
      } : {}),
    },
    aliases: { 'DeepSeek-V4.1-Flash (1017)': 'deepseek-v4-1-flash-1017', 'Qwen3.8-Max (0902)': 'qwen3-8-max-0902' },
    ...(subset === 'all' ? { chart: {
      title: 'Pass@1 and average cost per rollout',
      x: { key: 'cost', label: 'Mean cost per rollout', unit: '$', better: 'lower' as const },
      y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' as const },
    } } : {}),
    async fetch() {
      const html = await fetchText('https://cwe-bench.com/');
      if (!/CWE-bench\s*(?:&nbsp;|\s)*v2/i.test(html)) throw new Error('CWE-bench current version changed');
      const rows: LeaderboardRow[] = [];
      for (const m of html.matchAll(/<tr\b([^>]*\bdata-model="[^"]+"[^>]*)>([\s\S]*?)<\/tr>/g)) {
        const attrs = Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
        const score = num(attrs[`data-p1-${subset}`]);
        if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        const pass4 = num(attrs[`data-p4-${subset}`]);
        if (pass4 !== undefined) metrics.passAt4 = pass4;
        if (subset === 'all') {
          for (const [key, attr] of [['public', 'data-p1-public'], ['heldout', 'data-p1-heldout'], ['publicPassAt4', 'data-p4-public'], ['heldoutPassAt4', 'data-p4-heldout'], ['publicCost', 'data-cost-public'], ['heldoutCost', 'data-cost-heldout']] as const) {
            const v = num(attrs[attr]);
            if (v !== undefined) metrics[key] = v;
          }
        }
        const displayName = m[2].match(/<td[^>]*class="lb-name"[^>]*>([\s\S]*?)<\/td>/)?.[1];
        rows.push({ model: text(displayName ?? attrs['data-model']), score, setting: 'high reasoning; 1h limit',
          harness: text(m[2].match(/<td[^>]*class="[^"]*lb-harness-cell[^"]*"[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? '') || undefined,
          cost: num(attrs[`data-cost-${subset}`]), ...(Object.keys(metrics).length ? { metrics } : {}),
        });
      }
      if (!rows.length) throw new Error('CWE-bench v2 rows missing');
      return rows;
    },
  };
}

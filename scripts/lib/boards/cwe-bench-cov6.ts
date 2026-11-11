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
        const pass4 = num(attrs[`data-p4-${subset}`]);
        const displayName = m[2].match(/<td[^>]*class="lb-name"[^>]*>([\s\S]*?)<\/td>/)?.[1];
        rows.push({ model: text(displayName ?? attrs['data-model']), score, setting: 'high reasoning; 1h limit',
          harness: text(m[2].match(/<td[^>]*class="[^"]*lb-harness-cell[^"]*"[^>]*>([\s\S]*?)<\/td>/)?.[1] ?? '') || undefined,
          cost: num(attrs[`data-cost-${subset}`]), ...(pass4 === undefined ? {} : { metrics: { passAt4: pass4 } }),
        });
      }
      if (!rows.length) throw new Error('CWE-bench v2 rows missing');
      return rows;
    },
  };
}

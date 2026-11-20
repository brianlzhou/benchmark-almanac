// SWE-bench Multilingual: the "Multilingual" board in the same swebench.com data file as SWE-bench Verified
// (300 tasks in nine languages), scored as % resolved. Appendix A groups repositories by language. Read through the helper in swe-bench-verified.ts.
import type { Leaderboard } from './types.ts';
import { SWE_BENCH_ALIASES, SWE_BENCH_FEED, SWE_BENCH_TERMS, sweBenchRows, SWE_BENCH_BOARD } from './swe-bench-verified.ts';

// Repository, language and issue count from the board's dataset table.
const repositories: [string, string, number][] = [
  ['redis/redis', 'C', 12],
  ['jqlang/jq', 'C', 9],
  ['nlohmann/json', 'C++', 1],
  ['micropython/micropython', 'C', 5],
  ['valkey-io/valkey', 'C', 4],
  ['fmtlib/fmt', 'C++', 11],
  ['caddyserver/caddy', 'Go', 14],
  ['hashicorp/terraform', 'Go', 5],
  ['prometheus/prometheus', 'Go', 8],
  ['gohugoio/hugo', 'Go', 7],
  ['gin-gonic/gin', 'Go', 8],
  ['google/gson', 'Java', 9],
  ['apache/druid', 'Java', 5],
  ['projectlombok/lombok', 'Java', 17],
  ['apache/lucene', 'Java', 9],
  ['reactivex/rxjava', 'Java', 1],
  ['javaparser/javaparser', 'Java', 2],
  ['babel/babel', 'JavaScript/TypeScript', 5],
  ['vuejs/core', 'JavaScript/TypeScript', 5],
  ['facebook/docusaurus', 'JavaScript/TypeScript', 5],
  ['immutable-js/immutable-js', 'JavaScript/TypeScript', 2],
  ['mrdoob/three.js', 'JavaScript/TypeScript', 3],
  ['preactjs/preact', 'JavaScript/TypeScript', 17],
  ['axios/axios', 'JavaScript/TypeScript', 6],
  ['phpoffice/phpspreadsheet', 'PHP', 10],
  ['laravel/framework', 'PHP', 13],
  ['php-cs-fixer/php-cs-fixer', 'PHP', 10],
  ['briannesbitt/carbon', 'PHP', 10],
  ['jekyll/jekyll', 'Ruby', 5],
  ['fluent/fluentd', 'Ruby', 12],
  ['fastlane/fastlane', 'Ruby', 7],
  ['jordansissel/fpm', 'Ruby', 2],
  ['faker-ruby/faker', 'Ruby', 2],
  ['rubocop/rubocop', 'Ruby', 16],
  ['tokio-rs/tokio', 'Rust', 9],
  ['uutils/coreutils', 'Rust', 5],
  ['nushell/nushell', 'Rust', 5],
  ['tokio-rs/axum', 'Rust', 7],
  ['burntsushi/ripgrep', 'Rust', 2],
  ['sharkdp/bat', 'Rust', 8],
  ['astral-sh/ruff', 'Rust', 7],
];

function resolutionRates(details: Record<string, { resolved?: boolean }>) {
  const counts = new Map<string, { seen: number; solved: number }>();
  for (const [id, task] of Object.entries(details)) {
    if (typeof task.resolved !== 'boolean') continue;
    const repo = id.toLowerCase().replace(/-\d+$/, '').replace('__', '/');
    const count = counts.get(repo) ?? { seen: 0, solved: 0 };
    count.seen++;
    if (task.resolved) count.solved++;
    counts.set(repo, count);
  }
  const metrics: Record<string, number> = {};
  const languages = new Map<string, { expected: number; seen: number; solved: number }>();
  for (const [repo, lang, expected] of repositories) {
    const count = counts.get(repo);
    if (count?.seen === expected) metrics[repo] = 100 * count.solved / expected;
    const total = languages.get(lang) ?? { expected: 0, seen: 0, solved: 0 };
    total.expected += expected;
    total.seen += count?.seen ?? 0;
    total.solved += count?.solved ?? 0;
    languages.set(lang, total);
  }
  for (const [lang, count] of languages) {
    if (count.seen === count.expected) metrics[lang] = 100 * count.solved / count.expected;
  }
  return metrics;
}

const board: Leaderboard = {
  benchmark: 'swe-bench-multilingual',
  parts: Object.fromEntries(repositories.flatMap(([repo, lang]) => [[repo, { name: repo, group: 'Repository' }], [lang, { name: lang, group: 'Language' }]])),
  url: 'https://www.swebench.com/multilingual.html',
  feed: `${SWE_BENCH_FEED} (board "Multilingual")`,
  terms: SWE_BENCH_TERMS,
  aliases: SWE_BENCH_ALIASES,
  ...SWE_BENCH_BOARD,
  fetch: () => sweBenchRows('Multilingual', resolutionRates),
};
export default board;

// OpenStudio grades model changes against an artifact rubric. Its v1.2.1 report gives the full-assistance outcome pass rate over 16 progressive tasks, repeated three times.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/NatLabRockies/openstudio-mcp/develop/docs/testing/llm-test-benchmark.md";

const board: Leaderboard = {
  benchmark: "openstudio-mcp-1-2-1",
  url: "https://github.com/NatLabRockies/openstudio-mcp/blob/develop/docs/testing/llm-test-benchmark.md#current-baseline--outcome-graded-matrix-at-a-600-s-completion-budget-2026-08",
  feed: FEED,
  terms: "The repository license permits redistribution with notices and naming conditions. It does not specify separate terms for the scores. https://github.com/NatLabRockies/openstudio-mcp/blob/develop/LICENSE.txt GitHub requests a one-second crawl delay.",
  aliases: { 'Opus 4.6':'claude-opus-4-6','Opus 4.8':'claude-opus-4-8','Sonnet 4.6':'claude-sonnet-4-6','Haiku 4.5':'claude-haiku-4-5' },
  async fetch() {
    const all = markdownTables(await fetchText(FEED));
    const t = all.find(t => t[0].join('|') === 'Model|Outcome|Routing|Gap');
    const lat = all.find(t => t[0].includes('Median substituted duration'));
    if (!t || t.length < 7 || !lat) throw new Error('Missing OpenStudio tables');
    return t.slice(1).map(([model,outcome,routing,gap]) => {
      const duration = lat.find(r => r[0] === model);
      const score = num(outcome), route = num(routing), diff = num(gap), median = num(duration?.[3]);
      if (!model || score == null || route == null || diff == null || median == null) throw new Error('Incomplete OpenStudio result');
      return { model, score, trials: 3, setting: 'Full assistance, 600 s', metrics: { routing: route, gap: diff, medianSubstitutedSeconds: median } };
    });
  },
};
export default board;

// The Local LLM Arkanoid Test grades a browser game against 11 requirements after the model revises it.
// The scoreboard groups model configurations across three tables and links each playable game.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.aox.cz/bench/arkanoid/?view=scoreboard";

const RUBRIC_PARTS = [
  'Loads cleanly',
  'Mouse paddle control',
  'Ball launches',
  'Wall bounce',
  'Paddle bounce',
  'Brick field',
  'Destroy brick + score',
  'Paddle deflection angle',
  'Life loss',
  'Game over + restart',
  'Level clear / win',
] as const;

const board: Leaderboard = {
  benchmark: "aox-local-llm-arkanoid-test",
  url: "https://www.aox.cz/bench/arkanoid/",
  feed,
  terms: "The scoreboard does not state a reuse license. robots.txt allows the feed path.",
  parts: Object.fromEntries(RUBRIC_PARTS.map(k => [k, { name: k, unit: 'score' }])),
  stats: {
    firstPassSeconds: { name: 'First pass time', unit: 'seconds', better: 'lower' },
    secondPassSeconds: { name: 'Second pass time', unit: 'seconds', better: 'lower' },
    latency: { name: 'Total latency', unit: 'seconds', better: 'lower' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
    firstPassScore: { name: 'First pass score', unit: 'score', better: 'higher' },
  },
  chart: {
    title: 'Total wall time versus OpenRouter cost',
    x: { key: 'cost', label: 'OpenRouter cost', unit: '$', better: 'lower', log: true },
    y: { key: 'latency', label: 'Total wall time', unit: 's', better: 'lower', log: true },
    note: 'AOX plots total wall time against OpenRouter cost on log-log axes for cloud-priced models.',
  },
  async fetch() {
    const groups = tables(await fetchText(feed)).filter(t => t[0]?.[8]?.text === 'Rubric (11 items)');
    const rows = groups.flatMap(t => t.slice(1).map(c => {
      const model = c[1].html.match(/<a[^>]*>([^<]+)<\/a>/)?.[1];
      const score = c[8].text.match(/^(\d+(?:\.\d+)?)\/11$/);
      const link = c[11].html.match(/href="([^"]+)"/)?.[1];
      if (!model || !score || !link) throw new Error('Missing Arkanoid result');
      const setting = c[1].text.slice(model.length).trim() || undefined;
      const metrics: Record<string, number> = { firstPassSeconds: num(c[3].text)!, secondPassSeconds: num(c[4].text)!,
        latency: num(c[5].text)!, totalTokens: num(c[6].text)!, firstPassScore: num(c[9].text)! };
      for (const match of c[8].html.matchAll(/class="rs-tile rs-(pass|fail|partial)" title="([^":]+):/g)) {
        const key = match[2];
        if (match[1] === 'partial') continue;
        metrics[key] = match[1] === 'pass' ? 1 : 0;
      }
      return { model, setting, score: Number(score[1]), cost: num(c[7].text), metrics, link: new URL(link, feed).href };
    }));
    if (rows.length < 13) throw new Error('Missing Arkanoid configurations');
    return rows;
  },
};
export default board;

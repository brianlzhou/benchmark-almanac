// DrivingBench v2: general-purpose vision-language models drive a real Tesla through two cone courses with MCP tools.
// Read from the page's results table for both courses (the first table, the page's default view): each model's best
// progress over three same-context attempts, averaged over six trials (three a course), with ±1 standard error,
// mean cost per trial, output tokens, time per attempt, and each trial's best progress by course. The page says its
// fine-tuned driving models (VLAs and WAMs) answer a different question, so their table is not read. The human
// baseline is not a model and is left out.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://drivingbench.com/';
const strip = (s: string) => s.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, '').trim();
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const secs = (t: string) => t.split(':').reduce((a, x) => a * 60 + Number(x), 0);

const board: Leaderboard = {
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  benchmark: 'drivingbench-v2',
  url: URL,
  feed: `${URL} (the results table for both courses in the page HTML)`,
  terms: 'robots.txt allows the site. DrivingBench is research software with no stated data license. Results are credited to the DrivingBench team.',
  parts: {
    courseA: { name: 'Course A', group: 'Course', note: 'The original layout: a left, a long right sweep, a left hairpin and a sharp right into the finish.' },
    courseB: { name: 'Course B', group: 'Course', note: 'The second course on the same lot. Each course counts only its own three trials.' },
  },
  async fetch() {
    const html = await fetchText(URL);
    // the first results table on the page is the general-purpose models on both courses
    const at = html.indexOf('__name"><strong>');
    if (at < 0) throw new Error('DrivingBench: results table missing');
    const table = html.slice(html.lastIndexOf('<table', at), html.indexOf('</table>', at));
    const rows: LeaderboardRow[] = [];
    for (const [, tr] of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const name = tr.match(/__name"><strong>([^<]+)<\/strong>/)?.[1];
      const score = tr.match(/<strong class="mono">([\d.]+)%<\/strong>/)?.[1];
      if (!name || !score || /human/i.test(name)) continue;
      const se = tr.match(/standard error over trials">±(?:<!-- -->)?([\d.]+)/)?.[1];
      const cost = strip(tr.match(/<strong class="mono">\$([\d.]+)<\/strong>/)?.[1] ?? '');
      const tokens = tr.match(/<span[^>]*>([\d.]+)k<\/span> <span>output tokens/)?.[1];
      const time = tr.match(/>(\d+:\d\d)<span[^>]*> \/ attempt/)?.[1];
      const course = (c: 'A' | 'B') => [...tr.matchAll(new RegExp(`Course ${c}, trial \\d[^"]*"[^>]*><small>T\\d</small>([\\d.]+)%`, 'g'))].map((m) => Number(m[1]));
      const a = course('A');
      const b = course('B');
      if (a.length !== 3 || b.length !== 3) throw new Error(`DrivingBench: ${name} has ${a.length} and ${b.length} trials on the two courses`);
      rows.push({
        model: name,
        score: Number(score),
        setting: 'best of three attempts',
        trials: 6,
        cost: cost ? Number(cost) : undefined,
        tokens: tokens ? Number(tokens) * 1000 : undefined,
        metrics: {
          courseA: Math.round(mean(a) * 100) / 100,
          courseB: Math.round(mean(b) * 100) / 100,
          ...(se ? { stderr: Number(se) } : {}),
          ...(time ? { latency: secs(time) } : {}),
        },
      });
    }
    if (rows.length < 5) throw new Error(`DrivingBench: ${rows.length} models, expected at least 5`);
    return rows;
  },
};
export default board;

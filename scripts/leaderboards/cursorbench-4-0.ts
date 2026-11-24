// CursorBench 4.0. Cursor replaces the live chart when a new version launches: on 2026-11-18 cursor.com/cursorbench
// moved to CursorBench 4.1, so this board reads the Internet Archive's copy of the page from 2026-11-17 22:04 UTC, the
// last one that says "Compare CursorBench 4.0 results", and the chart data chunk the Archive saved with it. The chunk's
// 91 runs equal the 4.0 board we stored on 2026-11-17, before the switch. From 2026-11-18 to 2026-11-23 this board
// read the live page, which still names "CursorBench 4.0" in its changelog, so it stored 4.1 numbers by mistake.
// The chart's JS data contains every model and effort, including series hidden by default. Read literal objects as
// data, never execute the downloaded bundle. Score is task success in percent, avgCost is dollars per task,
// outputTokens is output tokens per task, and avgSteps is agent steps per task.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const SNAPSHOT = '20261117220402';
const PAGE = `https://web.archive.org/web/${SNAPSHOT}/https://cursor.com/cursorbench`;
const RAW_PAGE = `https://web.archive.org/web/${SNAPSHOT}id_/https://cursor.com/cursorbench`;
// the chunk's file name carries a content hash, so the Archive's copy is the exact file the page loaded
const CHUNK = 'https://web.archive.org/web/20261117220413id_/https://cursor.com/marketing-static/_next/static/immutable/chunks/0j8zueg4l4cnv.js';
const RUNS = 91;
const MODEL = /key:"([^"]+)",version:"[^"]+",label:"([^"]+)"[^\[{}]*,runs:\[([^\]]+)\]/g;
const board: Leaderboard = {
  benchmark: 'cursorbench-4-0', url: PAGE, feed: `${CHUNK} (the chart data of the archived 2026-11-17 page)`,
  stats: { steps: { name: 'Steps per task', unit: 'count', better: 'lower' } },
  terms: "Cursor's robots.txt allows the leaderboard. Cursor's terms restrict automated extraction. The Internet Archive preserves this public Cursor chart, and Benchmark Almanac credits and links Cursor as the source.",
  chart: {
    title: 'CursorBench score by average cost per task',
    x: { key: 'cost', label: 'Average cost per task', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'CursorBench score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const page = await fetchText(RAW_PAGE);
    if (!page.includes('Compare CursorBench 4.0 results') || page.includes('CursorBench 4.1')) throw new Error('Archived CursorBench page is not the 4.0 chart');
    if (!page.includes(new URL(CHUNK.replace(/^.*id_\//, '')).pathname)) throw new Error('Archived CursorBench page no longer loads the 4.0 chart chunk');
    await new Promise(resolve => setTimeout(resolve, 1050));
    const js = await fetchText(CHUNK);
    const rows: LeaderboardRow[] = [];
    for (const [, , model, runs] of js.matchAll(MODEL)) {
      for (const r of runs.matchAll(/\{([^{}]+)\}/g)) {
        const val = (key: string) => {
          const m = r[1].match(new RegExp(`(?:^|,)${key}:(-?(?:\\d+(?:\\.\\d*)?|\\.\\d+))(?=,|$)`));
          return m ? Number(m[1]) : undefined;
        };
        const score = val('score'), cost = val('avgCost'), tokens = val('outputTokens'), steps = val('avgSteps');
        if (score === undefined) throw new Error(`CursorBench score missing for ${model}`);
        rows.push({ model, score, cost, tokens, setting: r[1].match(/effort:"([^"]+)"/)?.[1], harness: 'Cursor', ...(steps === undefined ? {} : { metrics: { steps } }) });
      }
    }
    if (rows.length !== RUNS) throw new Error(`Archived CursorBench 4.0 chunk changed: ${rows.length} runs, expected ${RUNS}`);
    return rows;
  },
};
export default board;

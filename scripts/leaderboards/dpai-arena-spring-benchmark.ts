// DPAI Arena Spring Benchmark measures developer productivity agents on a Java and Spring evaluation.
// The board publishes a score for each Spring run, and each row names the agent, version, model, vendor and run duration.
// This importer reads the static scoreboard array from the DPAI site JavaScript bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

import { jsLiteral } from '../lib/html.ts';

interface Entry {
  rank: number | string; dataset: string; score: number | string; model: string; agent: string;
  version: string; duration: string; vendor: string; evalUrl: string;
}
const PAGE = 'https://dpaia.dev/';


const board: Leaderboard = {
  benchmark: 'dpai-arena-spring-benchmark',
  url: PAGE,
  feed: PAGE + ' (current scoreboard bundle)',
  harnesses: 'system',
  terms: 'DPAI allows the page in robots.txt and publishes the scoreboard as part of its open-source project without a separate score license. Results are credited to DPAI Arena with a link to the site.',
  async fetch() {
    const html = await fetchText(PAGE);
    const path = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!path) throw new Error('DPAI Arena: scoreboard bundle missing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const source = await fetchText(new URL(path, PAGE).href);
    const offset = source.search(/\[\{rank:1,agent:/);
    if (offset < 0) throw new Error('DPAI Arena: scoreboard array missing');
    const entries = jsLiteral<Entry[]>(source, offset);
    const rows: LeaderboardRow[] = [];
    for (const entry of entries) {
      if (entry.dataset !== 'Spring' || (entry.rank === '-' && entry.score === '-')) continue;
      const time = /^(\d+):([0-5]\d)$/.exec(entry.duration);
      if (typeof entry.score !== 'number' || !entry.model || !entry.agent || !entry.version || !time || !entry.evalUrl)
        throw new Error('DPAI Arena: incomplete Spring result');
      const effort = entry.model.match(/\(([^)]+)\)$/)?.[1];
      rows.push({
        model: entry.model, harness: entry.agent + ' ' + entry.version, setting: effort,
        agentOrg: entry.vendor, score: entry.score, link: entry.evalUrl,
        metrics: { durationMinutes: Number(time[1]) * 60 + Number(time[2]) },
      });
    }
    if (rows.length < 15) throw new Error(`DPAI Arena: ${rows.length} rows, expected at least 15`);
    return rows;
  },
};

export default board;

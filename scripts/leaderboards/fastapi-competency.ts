// Models implement FastAPI apps from specifications. Reward is mean partial credit across 34 apps.
// The package README gives whole-suite and difficulty scores under Observed scores.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://app.primeintellect.ai/dashboard/environments/toolshed/fastapi-competency';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/toolshed/fastapi-competency/@latest';
const board: Leaderboard = {
  benchmark: 'fastapi-competency', url, feed, terms: 'Toolshed lists the MIT license at ' + url,
  parts: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  async fetch() {
    const { data } = await fetchJson<{data: {package_url: string}}>(feed);
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], {
      input: Buffer.from(await fetchBytes(data.package_url)), encoding: 'utf8',
    });
    const table = markdownTables(readme).find(t => t[0].join('|') === 'Model|Reward|easy (5)|medium (12)|hard (17)');
    if (!table) throw new Error('Missing observed score columns');
    return checked(table.slice(1).map(([model, reward, easy, medium, hard]) => ({
      model, score: Number(reward), trials: 2, metrics: { easy: Number(easy), medium: Number(medium), hard: Number(hard) },
    })), 3);
  },
};
export default board;

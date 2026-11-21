// KlinikeBench tests clinical agents on 333 simulated patient encounters.
// The leaderboard reports strict pass@1, which requires passing all four gates, and three diagnostic measures.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const url = 'https://zehui127.github.io/klinikebench/';
const board: Leaderboard = {
  benchmark: 'klinikebench', url, feed: url,
  terms: 'The authors publish the project at ' + url + ' under the applicable GitHub terms at https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  parts: { diagnosis: 'Diagnosis', requiredTools: 'Required tools', mustAsk: 'Must-ask' },
  reference: ['Terminus 2'],
  async fetch() {
    const page = await fetchText(url);
    const data = page.match(/const ROWS\s*=\s*(\[[\s\S]+?\])\.map\(/)?.[1];
    const cols = [...page.matchAll(/data-k="([^"]+)"/g)].map(m => m[1]);
    if (!data || cols.join('|') !== 'pass|dx|tools|ask' || !page.includes('pass:r[2], dx:r[3], tools:r[4], ask:r[5]'))
      throw new Error('KlinikeBench leaderboard columns changed');
    const rows: [string, string, number, number, number, number][] = JSON.parse(data);
    return checked(rows.map(([model, , score, diagnosis, requiredTools, mustAsk]) => {
      if (![score, diagnosis, requiredTools, mustAsk].every(Number.isFinite)) throw new Error('Incomplete score for ' + model);
      return { model, harness: 'Terminus 2', score, metrics: { diagnosis, requiredTools, mustAsk } };
    }), 31);
  },
};
export default board;

// MiniWoB++ tests browser agents on short interaction tasks. BrowserGym publishes their mean success percentage.
// The results directory contains a miniwob.json file per agent, with its run date and standard error.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { setTimeout as delay } from 'node:timers/promises';

const url = 'https://huggingface.co/spaces/ServiceNow/browsergym-leaderboard';
const feed = 'https://huggingface.co/api/spaces/ServiceNow/browsergym-leaderboard/tree/main/results?recursive=true';
type Result = {agent_name: string, benchmark: string, score: number, std_err: number, date_time: string, study_id: string};
const board: Leaderboard = {
  benchmark: 'miniwob-plus-plus', host: 'BrowserGym', url, feed, harnesses: 'system',
  terms: 'The BrowserGym leaderboard uses MIT. https://huggingface.co/spaces/ServiceNow/browsergym-leaderboard/blob/main/README.md',
  aliases: { 'GPT-o1-mini': 'o1-mini', 'Claude-3.5-sonnet-20241022': 'claude-3-5-sonnet-october-2024', 'Claude-4-Sonnet': 'claude-sonnet-4' },
  async fetch() {
    const files = await fetchJson<{path:string}[]>(feed);
    const rows: LeaderboardRow[] = [];
    for (const file of files.filter(f => /^results\/[^/]+\/miniwob\.json$/i.test(f.path))) {
      await delay(1000);
      const source = url + '/raw/main/' + file.path;
      const runs = await fetchJson<Result[]>(source);
      for (const run of runs) {
        if (run.benchmark.toLowerCase() !== 'miniwob' || !Number.isFinite(run.score) || !Number.isFinite(run.std_err)) throw new Error('Invalid BrowserGym result');
        const agent = run.agent_name;
        const pair = agent.match(/^(GenericAgent|OrbyAgent)-(.+)$/);
        let model = pair?.[2] ?? agent;
        if (agent === 'OrbyAgent-Claude-3.5-Sonnet') model = 'Claude-3.5-sonnet-20241022';
        const date = run.date_time.startsWith('2021-01-01') ? run.study_id.match(/^\d{4}-\d{2}-\d{2}/)?.[0] : run.date_time.slice(0,10);
        rows.push({ model, harness: pair?.[1] ?? (agent === 'A3-Qwen3.5-9B' ? 'GenericAgent' : undefined),
          score: run.score, date, link: source, metrics: { stderr: run.std_err } });
      }
    }
    return checked(rows,16);
  },
};
export default board;

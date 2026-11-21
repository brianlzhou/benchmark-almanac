// ORCA-bench tests on-call agents' root cause analyses. The official board ranks by RCA Accuracy (Medium).
// The submission files also give hard-task accuracy, hallucination rate, standard errors and whole-run tokens.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'ORCA-bench/ORCA-bench';
const feed = 'https://api.github.com/repos/' + repo + '/contents/leaderboard/submissions';
type Entry = { name: string; download_url: string };
type Run = { metadata: { model_display: string; agent_display: string; date: string; reasoning_effort: string | null; agent_org: string };
  metrics: Record<string, number | string> | null };
const board: Leaderboard = {
  benchmark: 'orca-bench-oncall', url: 'https://github.com/' + repo + '#submitting-to-the-leaderboard', feed,
  terms: 'Apache License 2.0. https://github.com/ORCA-bench/ORCA-bench/blob/main/LICENSE',
  headline: 'RCA Accuracy (Medium) on incident tasks, the official leaderboard ranking metric.',
  parts: { medium: 'RCA Accuracy (Medium)', hard: 'RCA Accuracy (Hard)' }, reference: ['Terminus 2'],
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const file of await fetchJson<Entry[]>(feed)) {
      if (!file.name.endsWith('.json')) continue;
      if (rows.length) await new Promise(resolve => setTimeout(resolve, 1050));
      const {metadata, metrics} = await fetchJson<Run>(file.download_url);
      if (!metrics) continue;
      const number = (key: string) => {
        const n = metrics[key];
        if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error('Missing metric ' + key);
        return n;
      };
      const medium = number('rca_accuracy_incident_medium');
      const split = file.name.endsWith('-private.json') ? 'Private' : 'Public';
      rows.push({ model: metadata.model_display, harness: metadata.agent_display, agentOrg: metadata.agent_org,
        date: metadata.date, setting: metadata.reasoning_effort ? split + ', reasoning effort: ' + metadata.reasoning_effort : split, link: file.download_url,
        score: medium, metrics: { medium, stderr: number('rca_accuracy_incident_medium_stderr'),
          hard: number('rca_accuracy_incident_hard'), hardStderr: number('rca_accuracy_incident_hard_stderr'),
          hallucinationRate: number('hallucinate_any_incident'), hallucinationStderr: number('hallucinate_any_incident_stderr'),
          wholeRunTokens: number('total_tokens') } });
    }
    return checked(rows, 10);
  },
};
export default board;

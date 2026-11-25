// Incident Arena evaluates repair success across 20 service incidents. Its public leaderboard JSON reports pass@1, task-cluster bootstrap intervals and per-incident means.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://incident-arena.com/data/leaderboard.json";
interface Entry { name: string; effort: string; score: number; ci: number[]; n: number; cost: number | null; minutes: number | null; taskMeans: Record<string, number>; taskCount: number; experiment: string }

const board: Leaderboard = {
  benchmark: "incident-arena",
  parts: {
    '000--frappe--07-deletes-and-jobs-fail-194d9279': { name: 'Frappe 000 deletes and jobs fail', group: 'Incident' },
    '001--frappe--07-desk-and-queue-oom-0669b8e8': { name: 'Frappe 001 desk and queue OOM', group: 'Incident' },
    '002--frappe--07-desk-and-queue-outage-64526986': { name: 'Frappe 002 desk and queue outage', group: 'Incident' },
    '003--frappe--07-new-records-and-jobs-fail-f3320b4c': { name: 'Frappe 003 new records and jobs fail', group: 'Incident' },
    '004--frappe--07-new-records-and-queue-oom-8ccfd9e7': { name: 'Frappe 004 new records and queue OOM', group: 'Incident' },
    '006--saleor-spine--10-T1-statement-timeout-canary-c7dcd6d4': { name: 'Saleor 006 statement timeout canary', group: 'Incident' },
    '007--slack-spine--06-F3-split-sequencer-eef5b438': { name: 'Slack 007 split sequencer', group: 'Incident' },
    '008--slack-spine--06-F4-maintenance-collision-cc222870': { name: 'Slack 008 maintenance collision', group: 'Incident' },
    '009--slack-spine--06-logins-unread-and-sends-all-slow-since-noon-16e3fd23': { name: 'Slack 009 logins unread and sends slow', group: 'Incident' },
    '010--slack-spine--06-logins-unread-sends-slower-cccddfb2': { name: 'Slack 010 logins unread sends slower', group: 'Incident' },
    '011--slack-spine--06-sends-crawl-then-store-slows-3e65c480': { name: 'Slack 011 sends crawl then store slows', group: 'Incident' },
    '012--slack-spine--06-sends-fail-after-strict-mode-plausible-pool-d18e8739': { name: 'Slack 012 strict mode plausible pool', group: 'Incident' },
    '013--slack-spine--06-sends-fail-after-strict-mode-turns-on-728f0739': { name: 'Slack 013 strict mode turns on', group: 'Incident' },
    '014--slack-spine--06-sends-fail-during-compliance-window-1f4b1235': { name: 'Slack 014 compliance window', group: 'Incident' },
    '015--slack-spine--06-sends-fail-strict-pool-16-66fa1a7c': { name: 'Slack 015 strict pool 16', group: 'Incident' },
    '016--slack-spine--06-sends-slow-and-stall-every-minute-83867383': { name: 'Slack 016 sends slow and stall', group: 'Incident' },
    '017--slack-spine--06-stall-every-minute-and-later-every-send-crawls-bd50bae9': { name: 'Slack 017 stall and sends crawl', group: 'Incident' },
    '018--slack-spine--09-I1-seq-lock-leak-0b7c2973': { name: 'Slack 018 seq lock leak', group: 'Incident' },
    '019--slack-spine--13-P1-distractor-volume-shell-f73987d7': { name: 'Slack 019 distractor volume shell', group: 'Incident' },
    '07-writes-and-queue-oom-f1db8f42': { name: 'Writes and queue OOM', group: 'Incident' },
  },
  stats: { latency: { name: 'Latency per incident set', unit: 'seconds', better: 'lower', note: 'Elapsed time for the full incident run.' } },
  chart: {
    title: 'Pass@1 vs. execution time',
    x: { key: 'latency', label: 'Execution time per run', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Pass@1', unit: '%', better: 'higher' },
    note: 'Incident Arena plots pass@1 against agent execution time with a Pareto frontier.',
  },
  url: "https://incident-arena.com/",
  feed: FEED,
  terms: "The site offers a results download. I found no separate data license at https://incident-arena.com/ The robots URL returns 404.",
  async fetch() {
    const data = await fetchJson<{ models: Entry[]; sources: { experiment: string; sourceUrl?: string }[] }>(FEED);
    if (data.models.length < 15) throw new Error('Missing ranked incident configurations');
    const rows = data.models.map(r => {
      if (!r.name || ![r.score,r.ci?.[0],r.ci?.[1],r.n].every(Number.isFinite) || Object.keys(r.taskMeans).length !== r.taskCount || r.taskCount < 20) throw new Error('Incomplete incident result');
      const metrics: Record<string, number> = {};
      if (r.minutes != null) metrics.latency = r.minutes * 60;
      for (const [key, value] of Object.entries(r.taskMeans)) {
        if (!Number.isFinite(value)) throw new Error('Invalid incident mean');
        metrics[key] = value * 100;
      }
      return { model: r.name, setting: r.effort, score: r.score, low: r.ci[0], high: r.ci[1], trials: r.n, cost: r.cost ?? undefined,
        link: data.sources.find(s => s.experiment === r.experiment)?.sourceUrl, metrics };
    });
    return rows;
  },
};
export default board;

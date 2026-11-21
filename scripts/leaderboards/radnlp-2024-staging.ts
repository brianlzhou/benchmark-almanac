// The Japanese formal run ranks teams by fine-grained joint TNM staging accuracy. The leaderboard POST endpoint returns the organizers' final standings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://radnlp-radnlp2024-formalrun-japanese-maintask.hf.space/leaderboard";

const board: Leaderboard = {
  benchmark: "radnlp-2024-staging",
  url: "https://huggingface.co/spaces/RadNLP/RadNLP2024_FormalRun_Japanese_MainTask",
  feed,
  terms: "The competition rules describe scores and registration. They give no score reuse license. https://radnlp-radnlp2024-formalrun-japanese-maintask.hf.space/rules The Space host returns 404 for robots.txt.",
  stats: {
    'Joint accuracy (fine)': { name: 'Joint accuracy fine', unit: '%', better: 'higher', note: 'Accuracy requiring all tumor, node and metastasis labels to match at fine granularity.' },
    'Joint accuracy (coarse)': { name: 'Joint accuracy coarse', unit: '%', better: 'higher', note: 'Accuracy requiring all tumor, node and metastasis labels to match at coarse granularity.' },
  },
  parts: Object.fromEntries(['T accuracy (fine)', 'N accuracy (fine)', 'M accuracy (fine)', 'T accuracy (coarse)', 'N accuracy (coarse)', 'M accuracy (coarse)'].map(k => [k, k])),
  async fetch() {
    const d = await fetchJson<{response: string}>(feed, {method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({lb:'private'})});
    const [table] = markdownTables(d.response);
    const fields = ['Joint accuracy (fine)', 'T accuracy (fine)', 'N accuracy (fine)', 'M accuracy (fine)', 'Joint accuracy (coarse)', 'T accuracy (coarse)', 'N accuracy (coarse)', 'M accuracy (coarse)'];
    if (!table || table.length < 16 || table[0].join('|') !== ['rank','id',...fields,'submission_datetime'].join('|')) throw new Error('Missing RadNLP final submissions');
    return table.slice(1).map(c => {
      const metrics = Object.fromEntries(fields.map((k, i) => {
        if (!c[i+2] || !Number.isFinite(Number(c[i+2]))) throw new Error('Missing ' + k);
        return [k, Math.round(Number(c[i+2]) * 10000) / 100];
      }));
      return { model: c[1], submitter: c[1], score: metrics[fields[0]], date: c.at(-1)?.slice(0,10), metrics };
    });
  },
};

export default board;

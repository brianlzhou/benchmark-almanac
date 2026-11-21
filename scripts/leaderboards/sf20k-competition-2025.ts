// SF20K ranks short-film question answering teams by final accuracy. The competition endpoint returns a Markdown table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://slomo-workshop-sf20kcompetition.hf.space/leaderboard";

const board: Leaderboard = {
  benchmark: "sf20k-competition-2025",
  url: "https://huggingface.co/spaces/SLoMO-Workshop/SF20KCompetition",
  feed,
  terms: "The public endpoint accepts POST with {\"lb\":\"private\"} for final rankings. The count includes teams with positive final accuracy. The rules give no separate score reuse terms. https://slomo-workshop-sf20kcompetition.hf.space/rules The feed host returns no robots.txt.",
  stats: {
    judgeScore: { name: 'Judge score', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const { response } = await fetchJson<{ response: string }>(feed, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lb: 'private' }),
    });
    const [header, ...entries] = markdownTables(response)[0] ?? [];
    if (!header || !['id', 'accuracy', 'score', 'submission_datetime'].every(k => header.includes(k))) throw new Error('Missing final standings');
    const rows: LeaderboardRow[] = [];
    for (const entry of entries) {
      const cell = (key: string) => entry[header.indexOf(key)];
      const model = cell('id'), score = Number(cell('accuracy'));
      if (!model || !cell('accuracy') || !Number.isFinite(score)) throw new Error('Invalid final accuracy');
      if (score < 0) continue;
      rows.push({ model, submitter: model, score, metrics: { judgeScore: Number(cell('score')) }, date: cell('submission_datetime').slice(0, 10) });
    }
    if (rows.length < 8) throw new Error('Incomplete scored standings');
    return rows;
  },
};
export default board;

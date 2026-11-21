// ESCI evaluates multilingual product search. AIcrowd ranks three tasks separately with two different metrics.
// Task 1 private nDCG is the headline. The other private and public test scores are retained separately.
// The workshop papers identify the submissions: https://amazonkddcup.github.io/ (papers 3782, 8572, 4952 and 8408).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.aicrowd.com/challenges/esci-challenge-for-improving-product-search/leaderboards';
const systems = [
  { team: 'day-day-up', model: 'InfoXLM-large', setting: 'day-day-up fine-tuned ensemble', members: undefined },
  { team: 'ZhichunRoad', model: 'InfoXLM-large', setting: 'ZhichunRoad fine-tuning', members: undefined },
  { team: 'ETS-Lab', model: 'LightGBM', setting: 'ETS-Lab cross-encoder ensemble',
    members: ['LightGBM', 'bigbird-roberta-base', 'cocolm-base', 'debertav3-base', 'mdeberta-v3-base'] },
  { team: 'qinpersevere', model: 'DeBERTa-v3-large', setting: 'Multilingual ensemble',
    members: ['DeBERTa-v3-large', 'mDeBERTa-v3-base', 'RoBERTa-large', 'XLM-RoBERTa-large'] },
];
const parts = { ranking: 'Query-product ranking nDCG', classification: 'Multiclass product classification micro F1',
  substitute: 'Product substitute identification micro F1' };
const board: Leaderboard = {
  benchmark: 'esci-shopping-queries-dataset', url, feed: url + '?challenge_round_id=1236',
  terms: 'AIcrowd publishes challenge results subject to https://www.aicrowd.com/pages/terms-of-use.',
  headline: 'The competition ranks three tasks separately. The headline is private-test nDCG on the first task, query-product ranking.',
  parts,
  async fetch() {
    const scores = new Map<string, Record<string, number>>();
    for (const [i, key] of Object.keys(parts).entries()) {
      if (i) await new Promise(resolve => setTimeout(resolve, 1100));
      const link = url + '?challenge_round_id=1236' + (i ? '&challenge_leaderboard_extra_id=' + (1182 + i) : '');
      const measure = i ? 'F1 Score' : 'NDCG';
      const table = tables(await fetchText(link)).find(t => t[0]?.[3]?.text === measure + ' (Private)' && t[0][4].text === measure + ' (Public)');
      if (!table) throw new Error('Missing ESCI leaderboard: ' + key);
      for (const system of systems) {
        const row = table.slice(1).find(r => r[2]?.html.includes('>' + system.team + '</'));
        if (!row || ![3, 4].every(j => /^0\.\d+$/.test(row[j]?.text))) throw new Error('Missing ESCI submission: ' + system.team);
        const metrics = scores.get(system.team) ?? {};
        metrics[key] = Number(row[3].text);
        metrics[key + 'Public'] = Number(row[4].text);
        scores.set(system.team, metrics);
      }
    }
    const rows: LeaderboardRow[] = systems.map(s => ({ model: s.model, models: s.members, submitter: s.team, setting: s.setting,
      score: scores.get(s.team)!.ranking, metrics: scores.get(s.team)! }));
    return checked(rows, 4);
  },
};
export default board;

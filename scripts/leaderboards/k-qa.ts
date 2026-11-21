// K-QA measures clinical answer comprehensiveness over 201 questions. The authors’ Space
// reads two CSVs per configuration, rounds question-level recall and counts contradicting statements.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const root = 'https://huggingface.co/spaces/Itaykhealth/K-QA/raw/main/';
const board: Leaderboard = {
  benchmark: 'k-qa', url: 'https://huggingface.co/spaces/Itaykhealth/K-QA', feed: root + 'app.py',
  terms: 'The authors publish the Hugging Face Space under the MIT license.',
  async fetch() {
    const app = await fetchText(this.feed);
    const versions = [...(app.match(/VERSIONS = \(([\s\S]*?)\)/)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map(m => m[1]);
    if (versions.length < 13 || !app.includes('N_QUESTIONS = 201')) throw new Error('K-QA protocol changed');
    const rows: LeaderboardRow[] = [];
    for (const version of versions) {
      const csv = async (name: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return parseCsv(await fetchText(root + 'data/' + encodeURIComponent(version) + '/' + name + '.csv'));
      };
      const stats = await csv('dataset_statistics');
      const labels = await csv('reasoning');
      if (!stats.length || !labels.length || !('recall_Must_have' in stats[0]) || !('label_is_contradict' in labels[0])) throw new Error('K-QA data missing');
      const sum = stats.reduce((v,r) => v + Math.round(Number(r.recall_Must_have) * 1000) / 1000, 0);
      const contradictions = labels.filter(r => /^(1(?:\.0)?|true)$/i.test(r.label_is_contradict)).length;
      if (!Number.isFinite(sum)) throw new Error('Invalid K-QA recall');
      const [model, ...modes] = version.split('+');
      rows.push({ model, setting: modes.join('+') || undefined, score: sum * 100 / 201,
        metrics: { hallucinationRate: contradictions * 100 / 201, answered: stats.length } });
    }
    return rows;
  },
};
export default board;

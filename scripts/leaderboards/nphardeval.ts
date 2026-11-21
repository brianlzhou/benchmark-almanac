// NPHardEval ranks models by average weighted accuracy across nine algorithmic problems. The Space configuration includes the full results table.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://nphardeval-nphardeval-leaderboard.hf.space/config";
const problems = ['SAS', 'SPP', 'EDP', 'TSP_D', 'GCP_D', 'KSP', 'TSP', 'GCP', 'MSP'];
interface Frame { headers: string[]; data: (string | number | boolean)[][] }

const board: Leaderboard = {
  benchmark: "nphardeval",
  url: "https://huggingface.co/spaces/NPHardEval/NPHardEval-leaderboard",
  feed: FEED,
  terms: "The Space lists apache-2.0 for its repository. https://huggingface.co/spaces/NPHardEval/NPHardEval-leaderboard/blob/main/README.md",
  parts: Object.fromEntries(problems.map(k => [k, k])),
  async fetch() {
    const config = await fetchJson<{ components: { type: string; props: { value: Frame } }[] }>(FEED);
    const table = config.components.find(c => c.type === 'dataframe' && c.props.value.headers.includes('#Params (B)'))?.props.value;
    if (!table || table.data.length < 12) throw new Error('Missing NPHardEval results');
    const required = ['Model', 'Avg ⬆️', 'Type', '#Params (B)', 'Hub License', 'Available on the hub', ...problems];
    if (!required.every(k => table.headers.includes(k))) throw new Error('Missing NPHardEval column');
    return table.data.map(row => {
      const get = (k: string) => row[table.headers.indexOf(k)];
      const number = (k: string) => {
        const v = get(k);
        if (typeof v !== 'number') throw new Error('Missing NPHardEval score: ' + k);
        return v;
      };
      const label = String(get('Model'));
      const params = get('#Params (B)');
      const license = get('Hub License');
      return { model: text(label), score: number('Avg ⬆️'), open: get('Type') === 'open-source',
        license: typeof license === 'string' && license !== '?' ? license : undefined,
        params: typeof params === 'number' && params > 0 ? params : undefined,
        link: get('Available on the hub') ? label.match(/href="([^"]+)"/)?.[1] : undefined,
        metrics: Object.fromEntries(problems.map(k => [k, number(k)])) };
    });
  },
};
export default board;

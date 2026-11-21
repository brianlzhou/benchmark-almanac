// The embedded firmware benchmark measures successful simulator runs by model and feedback condition. The authors' official summary records pass rates and run counts.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://raw.githubusercontent.com/jgcarrasco/closed_loop_evaluation_agents_embedded/4cb20a3860387fb628de8f1be79d6ef94ace21ec/artifacts/evaluations/paper_closed_loop_eval_420/official_summary_by_model_mode.csv";
const board: Leaderboard = {
  benchmark: "closed-loop-embedded-firmware",
  url: "https://github.com/jgcarrasco/closed_loop_evaluation_agents_embedded/blob/main/artifacts/evaluations/paper_closed_loop_eval_420/official_summary_by_model_mode.csv",
  feed: FEED,
  terms: "The repository lists no license. The authors release the paper under CC BY 4.0. https://arxiv.org/abs/2610.11447 The raw file host has no robots.txt.",
  async fetch() {
    const text = await fetchText(FEED);
    const expected = ["model_name", "mode", "pass_count", "run_count", "pass_rate_pct"];
    const records = parseCsv(text.replace(/^\uFEFF/, ''));
    const headers = Object.keys(records[0] ?? {});
    const rows = records.map(record => headers.map(h => record[h]));
    if (!expected.every(h => headers.includes(h)) || rows.length < 28) throw new Error('Missing leaderboard columns or rows');
    return rows.map(cells => {
      const cell = (name: string) => cells[headers.indexOf(name)]?.trim();
      const number = (name: string) => {
        const raw = cell(name)?.replace(/%$/, '');
        if (!raw || !Number.isFinite(Number(raw))) throw new Error('Invalid ' + name + ' for ' + cells[0]);
        return Number(raw);
      };
      const model = cell("model_name");
      if (!model) throw new Error('Missing model name');
      return { model, score: number("pass_rate_pct"), metrics: { "passed": number("pass_count") }, trials: number('run_count'), setting: cell('mode') };
    });
  },
};
export default board;

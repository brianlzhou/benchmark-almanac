// The archived Open LLM Leaderboard ranks submissions by their six-task average. Its Space loads the public train split of the results dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { parquetReadObjects } from 'hyparquet';
import { fetchBytes } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/open-llm-leaderboard-old/contents/resolve/main/data/train-00000-of-00001-96886cb34a7bc800.parquet";

const board: Leaderboard = {
  benchmark: "open-llm-leaderboard-v1",
  url: "https://huggingface.co/spaces/open-llm-leaderboard-old/open_llm_leaderboard",
  feed,
  terms: "See the publisher’s Space and each upstream dataset license at https://huggingface.co/spaces/open-llm-leaderboard-old/open_llm_leaderboard Hugging Face allows the results dataset in robots.txt.",
  parts: Object.fromEntries(['ARC', 'HellaSwag', 'MMLU', 'TruthfulQA', 'Winogrande', 'GSM8K'].map(k => [k, k])),
  async fetch() {
    const records = await parquetReadObjects({ file: await fetchBytes(feed) });
    const tasks = Object.keys(board.parts!);
    if (records.length < 7260) throw new Error('Incomplete archived leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const [i, r] of records.entries()) {
      if (!r.fullname || !Object.hasOwn(r, 'Average ⬆️')) throw new Error('Missing archived model or average');
      if (!Number.isFinite(r['Average ⬆️'])) continue;
      const metrics: Record<string, number> = {};
      for (const k of tasks) {
        if (!Object.hasOwn(r, k)) throw new Error('Missing task ' + k);
        if (Number.isFinite(r[k])) metrics[k] = r[k];
      }
      rows.push({ model: r.fullname, score: r['Average ⬆️'], setting: r.Precision, metrics, open: true,
        license: r['Hub License'] === 'unknown' ? undefined : r['Hub License'], params: r['#Params (B)'] > 0 ? r['#Params (B)'] : undefined,
        date: r.date?.slice(0, 10), link: 'https://huggingface.co/datasets/open-llm-leaderboard-old/contents/viewer/default/train?row=' + i });
    }
    if (rows.length < 7170) throw new Error('Missing scored submissions');
    return rows;
  },
};

export default board;

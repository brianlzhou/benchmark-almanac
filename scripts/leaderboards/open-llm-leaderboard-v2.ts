// Open LLM Leaderboard v2 (Hugging Face, archived in 2025), read from its public results dataset
// open-llm-leaderboard/contents through the Hugging Face dataset viewer's /rows API. The score is "Average ⬆️",
// the normalized mean of the six tasks, and the six task scores go in metrics. CO2 is not a cost, so it is not read.
// The dataset holds about 4,600 entries, most of them community fine-tunes and merges. This reads only the board's
// "Official Providers" entries plus the model makers listed below, the view a reader of the almanac compares.
// The viewer's /filter endpoint fails on this dataset, so the importer pages through /rows and filters itself.
// Flagged entries are skipped, as the board hides them. Precision is the setting when it is not 16-bit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fcontents&config=default&split=train';
const MAKERS = new Set(['Qwen', 'meta-llama', 'google', 'microsoft', 'mistralai', 'deepseek-ai', 'CohereForAI', 'CohereLabs', 'nvidia', 'allenai', 'tiiuae', 'ibm-granite', '01-ai']);
const TASKS = ['IFEval', 'BBH', 'MATH Lvl 5', 'GPQA', 'MUSR', 'MMLU-PRO'];

const board: Leaderboard = {
  benchmark: 'open-llm-leaderboard-v2',
  url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  feed: `${FEED} ("Official Providers" entries and listed makers)`,
  terms: 'Public results dataset published by the board on Hugging Face, read through the dataset viewer API.',
  aliases: {},
  async fetch() {
    const out: LeaderboardRow[] = [];
    let offset = 0;
    let total = Infinity;
    while (offset < total) {
      if (offset) await new Promise((resolve) => setTimeout(resolve, 6000));
      let page: { rows: { row: Record<string, any> }[]; num_rows_total: number } | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          page = await fetchJson<typeof page>(`${FEED}&offset=${offset}&length=100`);
          break;
        } catch (error) {
          if (!String(error).includes('429') || attempt === 3) throw error;
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }
      if (!page?.rows?.length) throw new Error(`Incomplete Open LLM results at ${offset}/${total}`);
      total = page.num_rows_total;
      for (const { row: r } of page.rows) {
        if (!r.fullname || typeof r['Average ⬆️'] !== 'number' || r.Flagged) continue;
        const owner = String(r.fullname).split('/')[0];
        if (!r['Official Providers'] && !MAKERS.has(owner)) continue;
        const metrics: Record<string, number> = {};
        for (const k of TASKS) if (typeof r[k] === 'number') metrics[k] = r[k];
        const precision = /^b?float16$/.test(r.Precision ?? '') ? undefined : r.Precision || undefined;
        out.push({
          model: MAKERS.has(owner) ? r.fullname : r.fullname.replace('/', ' '),
          score: r['Average ⬆️'],
          setting: precision,
          date: r['Submission Date'] || undefined,
          metrics,
        });
      }
      offset += page.rows.length;
    }
    if (!out.length) throw new Error('Open LLM results missing');
    return out;
  },
};
export default board;

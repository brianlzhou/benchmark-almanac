// MuSR on the Open LLM Leaderboard v2 (Hugging Face, archived in 2025), read from the same results dataset as
// open-llm-leaderboard-v2.ts. The score is the "MUSR Raw" column times 100: accuracy over the three MuSR tasks.
// The board's own "MUSR" column is rescaled so that chance scores 0, which labs never report, so it is not used.
// Only the model makers' own uploads are kept. The thousands of community fine-tunes and merges stay on the
// whole-board import, since no lab reports MuSR for them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { OPEN_LLM_MAKERS, openLlmEntries, openLlmModel, openLlmOwner, openLlmPrecision } from './open-llm-leaderboard-v2.ts';

const SETTING = 'Open LLM Leaderboard harness, raw accuracy';
const board: Leaderboard = {
  benchmark: 'musr',
  host: 'Hugging Face',
  url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  feed: 'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fcontents&config=default&split=train (MUSR Raw column, model makers only)',
  terms: 'Public results dataset published by the board on Hugging Face, read through the dataset viewer API.',
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = (await openLlmEntries())
      .filter((r) => OPEN_LLM_MAKERS.has(openLlmOwner(r)) && typeof r['MUSR Raw'] === 'number')
      .map((r) => {
        const precision = openLlmPrecision(r);
        return { model: openLlmModel(r), score: r['MUSR Raw'] * 100, setting: precision ? `${SETTING}, ${precision}` : SETTING, date: r['Submission Date'] || undefined };
      });
    if (!rows.length) throw new Error('Open LLM MuSR rows missing');
    return rows;
  },
};
export default board;

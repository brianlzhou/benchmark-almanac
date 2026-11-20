// MuSR on the Open LLM Leaderboard v2 (Hugging Face, archived in 2025), read from the same results dataset as
// open-llm-leaderboard-v2.ts. The score is the "MUSR Raw" column times 100: accuracy over the three MuSR tasks.
// The board's own "MUSR" column is rescaled so that chance scores 0, which labs never report, so it stays a secondary metric.
// Only the model makers' own uploads are kept. The thousands of community fine-tunes and merges stay on the
// whole-board import, since no lab reports MuSR for them.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { OPEN_LLM_MAKERS, openLlmEntries, openLlmModel, openLlmOwner } from './open-llm-leaderboard-v2.ts';

const SETTING = 'Open LLM Leaderboard harness, raw accuracy';
const board: Leaderboard = {
  benchmark: 'musr',
  host: 'Hugging Face',
  url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  feed: 'https://huggingface.co/datasets/open-llm-leaderboard/contents/resolve/main/data/train-00000-of-00001.parquet (MUSR Raw, model makers only)',
  terms: 'Public results dataset published by the board on Hugging Face, read through the dataset viewer API.',
  async fetch(): Promise<LeaderboardRow[]> {
    const rows = (await openLlmEntries())
      .filter((r) => OPEN_LLM_MAKERS.has(openLlmOwner(r)) && typeof r['MUSR Raw'] === 'number')
      .map((r) => {
        const precision = r.Precision;
        const metrics: Record<string, number> = {};
        if (Number.isFinite(r.MUSR)) metrics.normalized = r.MUSR;
        if (Number.isFinite(r['CO₂ cost (kg)'])) metrics.suiteCo2Kg = r['CO₂ cost (kg)'];
        if (r['Hub ❤️'] != null) metrics.hubLikes = Number(r['Hub ❤️']);
        return { model: openLlmModel(r), metrics, open: true,
          params: r['#Params (B)'] > 0 ? r['#Params (B)'] : undefined,
          license: r['Hub License'] && r['Hub License'] !== 'unknown' ? r['Hub License'] : undefined,
          link: r.resultUrl,
          score: r['MUSR Raw'] * 100, setting: precision ? `${SETTING}, ${precision}` : SETTING, date: r['Submission Date'] || undefined };
      });
    if (!rows.length) throw new Error('Open LLM MuSR rows missing');
    return rows;
  },
};
export default board;

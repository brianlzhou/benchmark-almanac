// VidScribe measures visible text in generated videos. Its CSV gives the overall percentage on the released half, averaging four metric groups.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/datasets/Vicky0720/VidScribe/resolve/main/results/leaderboard.csv";

const parts = {
  A1: 'Content Accuracy', A2: 'Glyph Correctness', B1: 'Content Stability', B2: 'Appearance Stability',
  C1: 'Color', C2: 'Stroke Weight', C3: 'Typographic Style', C4: 'Carrier Attachment', C5: 'Spatial Placement', C6: 'Layout Hierarchy',
  D1: 'Background Consistency', E1: {name: 'Editing Residue', better: 'lower' as const}, E2: 'Source Text Preservation',
  T2V_overall: 'T2V', R2V_overall: 'R2V', I2V_overall: 'I2V', V2V_overall: 'V2V',
};

const board: Leaderboard = {
  benchmark: "vidscribe",
  url: "https://huggingface.co/datasets/Vicky0720/VidScribe#leaderboard-on-the-released-half-",
  feed: FEED,
  terms: "Noncommercial research use only. The authors say that the generated videos and scores also remain subject to provider terms. https://huggingface.co/datasets/Vicky0720/VidScribe#data-notes-and-terms",
  parts,
  aliases: {
    "Seedance 2.5": "dreamina-seedance-2-5"
  },
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length < 7) throw new Error('VidScribe: fewer than seven models');
    return rows.map((r): LeaderboardRow => {
      const metrics: Record<string, number> = {};
      for (const k of [...Object.keys(parts), 'task_balanced_overall']) {
        if (!(k in r)) throw new Error('Missing VidScribe column ' + k);
        if (r[k].trim()) {
          metrics[k] = Number(r[k]);
          if (!Number.isFinite(metrics[k])) throw new Error('Invalid VidScribe value for ' + k);
        }
      }
      if (!r.model_name || !r.overall?.trim() || !Number.isFinite(Number(r.overall))) throw new Error('Missing VidScribe overall score');
      return {model: r.model_name, score: Number(r.overall), metrics};
    });
  },
};
export default board;

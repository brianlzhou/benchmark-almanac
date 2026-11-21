// Beyond Survival evaluates language models in WereBench social-deduction games.
// Table 3 reports speech accuracy across five dimensions and two decision measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const board: Leaderboard = {
  benchmark: 'beyond-survival',
  static: 'paper',
  url: 'https://aclanthology.org/2026.emnlp-main.2208/',
  feed: 'https://aclanthology.org/2026.emnlp-main.2208.pdf',
  terms: 'The paper is publicly available from ACL Anthology. https://aclanthology.org/2026.emnlp-main.2208/',
  async fetch(): Promise<LeaderboardRow[]> {
    return checked([
      ['GPT-5-nano', .282, .375, .238, .325, .332, .311, .379, .493],
      ['GPT-oss-20B', .334, .425, .339, .338, .358, .358, .265, .283],
      ['Gemma-3-27B-IT', .325, .439, .281, .405, .296, .349, .573, .409],
      ['Qwen3-30B-A3B', .382, .529, .401, .426, .416, .431, .361, .335],
      ['Qwen3-32B', .381, .567, .363, .525, .394, .446, .576, .442],
      ['Llama-4-Scout', .390, .559, .386, .578, .339, .450, .494, .489],
      ['QwQ-32B', .384, .577, .408, .470, .440, .456, .573, .438],
      ['GPT-5-mini', .419, .516, .429, .586, .489, .488, .610, .562],
      ['DeepSeek-V3.1', .447, .637, .397, .684, .436, .520, .661, .526],
      ['Gemini-2.5-Flash', .491, .601, .527, .702, .468, .558, .561, .494],
      ['DeepSeek-V3.2-Exp', .491, .653, .468, .735, .462, .565, .755, .526],
      ['GLM-4.5', .510, .666, .513, .638, .540, .573, .543, .511],
      ['GPT-5', .505, .660, .524, .740, .504, .587, .658, .595],
      ['Deepseek-R1', .515, .652, .516, .728, .537, .590, .639, .460],
      ['Gemini-2.5-pro', .609, .757, .687, .867, .637, .715, .723, .551],
    ].map(([model, ri, sj, dr, ps, ct, avg, va, oi]) => ({
      model: model as string,
      score: (avg as number) * 100,
      metrics: { RI: (ri as number) * 100, SJ: (sj as number) * 100, DR: (dr as number) * 100, PS: (ps as number) * 100, CT: (ct as number) * 100, VA: (va as number) * 100, OI: (oi as number) * 100 },
    })), 15);
  },
};

export default board;

// SMILE tests whether models can explain why people laugh in sitcom and TED clips.
// Table 3 reports BLEU4, METEOR, ROUGE-L and BERTScore for named language models and modality settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2312.09818';
const board: Leaderboard = {
  benchmark: 'smile-video-laugh-reasoning', url: 'https://arxiv.org/abs/2312.09818', feed, static: 'paper',
  terms: 'The authors publish their paper under the license linked at https://arxiv.org/abs/2312.09818.',
  parts: {bleu4:'BLEU4', meteor:'METEOR', rougeL:'ROUGE-L'},
  headline: 'The headline is BERTScore F1, the last metric in the paper’s laugh-reasoning table.',
  async fetch() {
    const block = (await pdfText(feed)).split('Table 3: Evaluation on laugh reasoning with LLMs.')[0].split('Model        Num. of parameters').at(-1);
    if (!block) throw new Error('Missing SMILE laugh reasoning table');
    const rows: LeaderboardRow[] = [];
    const models = ['LLaMA (FT)', 'GPT-3 (zero-shot)', 'GPT-3 (3-shot)', 'GPT-3 (FT)'];
    for (const model of models) {
      const part = block.split(model)[1]?.split(/\n\s*(?:GPT-3|Table 3)/)[0];
      if (!part) throw new Error('Missing SMILE model ' + model);
      for (const row of part.matchAll(/\b(T|A\+V\+T)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)) {
        const [, modality, bleu4, meteor, rougeL, bert] = row;
        rows.push({model, setting: modality === 'T' ? 'Transcript only' : 'Audio, video, and transcript',
          score: Number(bert), metrics: {bleu4:Number(bleu4), meteor:Number(meteor), rougeL:Number(rougeL)}});
      }
    }
    return checked(rows, 7);
  },
};
export default board;

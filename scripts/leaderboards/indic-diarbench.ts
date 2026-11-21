// Indic DiarBench measures speaker diarization error on multilingual recordings.
// Table 3 gives duration-weighted diarization error and five companion metrics across the supported conditions.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://arxiv.org/pdf/2607.23808";
const board: Leaderboard = {
  benchmark: 'indic-diarbench', static: 'paper',
  url: "https://arxiv.org/pdf/2607.23808",
  feed,
  terms: "arXiv allows PDF access and specifies a 15-second crawl delay. Table 3 reports duration-weighted error rates. Figure 2 shows which languages each system covers. The dataset uses CC BY 4.0. https://huggingface.co/datasets/sarvamai/indic-diarbench",
  async fetch() {
    const source = await pdfText(feed);
    const section = source.split('Table 3: Duration-weighted aggregate metrics')[1]?.split('Rather than correcting')[0];
    if (!section || !/DER\s+cpWER\s+WDER\s+Miss\s+FA\s+Conf/.test(section)) throw new Error('Missing duration-weighted results');
    const names = ['Sarvam','AWS Transcribe','ElevenLabs Scribe','Azure STT','Deepgram Nova-3','AssemblyAI','GPT-4o','Gemini 3 Pro'];
    return names.map(model => {
      const line = section.split('\n').find(l => l.includes(model) && /\d+\.\d+\s*$/.test(l));
      const values = line?.split(model)[1].trim().split(/\s+/).map(Number);
      if (!values || values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Missing results for ' + model);
      const [score,cpWER,WDER,miss,falseAlarm,confusion] = values;
      return { model, score, metrics: { cpWER, WDER, miss, falseAlarm, confusion } };
    });
  },
};
export default board;

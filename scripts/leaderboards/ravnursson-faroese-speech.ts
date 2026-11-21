// The Ravnursson paper evaluates five Whisper sizes on Faroese speech without adaptation. Table 6 gives test and development word error rates as percentages.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2023.nodalida-1.4.pdf";
const board: Leaderboard = {
  benchmark: "ravnursson-faroese-speech", static: 'paper',
  url: "https://aclanthology.org/2023.nodalida-1.4.pdf",
  feed: FEED,
  terms: "Table 6 lists five unadapted Whisper sizes. Use the Test column. Word error rates above 100% are valid. The corpus uses CC BY 4.0. https://repository.clarin.is/repository/xmlui/handle/20.500.12537/276 The host has no published robots directives at /robots.txt.",
  parts: { dev: { name: 'Dev WER', unit: '%', better: 'lower' } },
  async fetch() {
    const block = (await pdfText(FEED)).match(/Whisper\s+Dev\s+Test([\s\S]*?)Table 6: Whisper WER Results/);
    if (!block) throw new Error('Missing Whisper WER table');
    const rows = [...block[1].matchAll(/^\s*(Tiny|Base|Small|Medium|Large)\s+([\d.]+)%\s+([\d.]+)%/gm)].map(([,size,dev,test]) =>
      ({ model: 'Whisper ' + size, score: Number(test), setting: 'Without fine-tuning', metrics: { dev: Number(dev) } }));
    if (new Set(rows.map(r => r.model)).size < 5) throw new Error('Missing Whisper sizes');
    return rows;
  },
};
export default board;

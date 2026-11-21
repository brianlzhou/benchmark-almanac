// GAIK reports word error rate on 600 Finnish dialect utterances from ten held-out municipalities.
// The README selects the published configurations. The SKN score file supplies error counts and timing.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const base = 'https://raw.githubusercontent.com/GAIK-project/finnish-asr/main/';
const feed = base + 'results/benchmarks/skn_fi/scores.json';
interface Arm {
  label: string; WER: number; CER: number; SUB: number; DEL: number; INS: number;
  ref_words: number; empty_hyps: number; seconds_per_utterance?: number; utterances: number;
}
const board: Leaderboard = {
  benchmark: 'gaik-skn-dialects', url: 'https://github.com/GAIK-project/finnish-asr#public-test-sets-skn-and-la-murre-dialects-fleurs-and-voxpopuli',
  feed, terms: 'GAIK requests credit under CC BY 4.0. The raw file host supplies no robots.txt rules.',
  aliases: { 'Gemini 3.5 Flash (API, asked for standard Finnish)': 'gemini-3-5-flash', 'Gemini 3.5 Flash (API, asked to write as spoken)': 'gemini-3-5-flash' },
  async fetch() {
    const readme = await fetchText(base + 'README.md');
    const block = readme.match(/<!-- benchmark-table:start -->([\s\S]*?)<!-- benchmark-table:end -->/)?.[1];
    if (!block?.includes('| Model | SKN dialects WER % |')) throw new Error('Missing SKN results table');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const {arms} = await fetchJson<{arms: Arm[]}>(feed);
    const rows = [];
    for (const line of block.split('\n')) {
      const match = /^\| ([^|]+?) \| (\d+(?:\.\d+)?) \|/.exec(line);
      if (!match) continue;
      const arm = arms.find(a => a.label === match[1]);
      if (!arm || Math.abs(arm.WER - Number(match[2])) > 0.051) throw new Error('README and score file disagree for ' + match[1]);
      const model = match[1].replaceAll('**', '');
      const setting = model.match(/\((API[^)]*)\)/)?.[1];
      rows.push({ model, setting, score: arm.WER, metrics: { characterErrorRate: arm.CER, substitutions: arm.SUB, deletions: arm.DEL,
        insertions: arm.INS, referenceWords: arm.ref_words, emptyTranscripts: arm.empty_hyps, utterances: arm.utterances,
        ...(typeof arm.seconds_per_utterance === 'number' ? { latency: arm.seconds_per_utterance } : {}) } });
    }
    if (rows.length < 21) throw new Error('Missing SKN configurations');
    return rows;
  },
};
export default board;

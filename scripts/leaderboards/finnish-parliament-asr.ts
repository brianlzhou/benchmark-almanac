// GAIK ranks Finnish Parliament transcriptions by word error rate. Its published table selects the configurations and the score file supplies precision and timing.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const base = 'https://raw.githubusercontent.com/GAIK-project/finnish-asr/main/';
const feed = base + 'results/benchmarks/parl_fi/scores.json';
interface Arm {
  label: string; WER: number; CER: number; SUB: number; DEL: number; INS: number;
  ref_words: number; empty_hyps: number; seconds_per_utterance?: number; utterances: number;
}
const board: Leaderboard = {
  benchmark: 'finnish-parliament-asr', url: 'https://github.com/GAIK-project/finnish-asr#public-test-sets-skn-and-la-murre-dialects-fleurs-and-voxpopuli',
  feed, terms: 'GAIK requests credit under CC BY 4.0. The raw file host supplies no robots.txt rules.',
  stats: { characterErrorRate: { name: 'Character error rate', unit: '%', better: 'lower' }, substitutions: { name: 'Substitutions', unit: 'count', better: 'lower' }, deletions: { name: 'Deletions', unit: 'count', better: 'lower' }, insertions: { name: 'Insertions', unit: 'count', better: 'lower' }, referenceWords: { name: 'Reference words', unit: 'count' }, emptyTranscripts: { name: 'Empty transcripts', unit: 'count', better: 'lower' }, utterances: { name: 'Utterances', unit: 'count' }, latency: { name: 'Latency per utterance', unit: 'seconds', better: 'lower' } },
  aliases: { 'NVIDIA Nemotron 3.5 Transcribe': 'nemotron-3-5-transcribe-30b-a4b' },
  async fetch() {
    const readme = await fetchText(base + 'README.md');
    const block = readme.match(/<!-- benchmark-table:start -->([\s\S]*?)<!-- benchmark-table:end -->/)?.[1];
    if (!block?.includes('| Parliament WER % |')) throw new Error('Missing Parliament results table');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const {arms} = await fetchJson<{arms: Arm[]}>(feed);
    const rows = [];
    for (const line of block.split('\n')) {
      const match = /^\| ([^|]+?) \| (?:[^|]+\| ){4}(\d+(?:\.\d+)?) \|/.exec(line);
      if (!match) continue;
      const arm = arms.find(a => a.label === match[1]);
      if (!arm || Math.abs(arm.WER - Number(match[2])) > 0.051) throw new Error('README and score file disagree for ' + match[1]);
      const model = match[1].replaceAll('**', '');
      const setting = model.match(/\((API[^)]*)\)/)?.[1];
      rows.push({ model, setting, score: arm.WER, metrics: { characterErrorRate: arm.CER, substitutions: arm.SUB, deletions: arm.DEL,
        insertions: arm.INS, referenceWords: arm.ref_words, emptyTranscripts: arm.empty_hyps, utterances: arm.utterances,
        ...(typeof arm.seconds_per_utterance === 'number' ? { latency: arm.seconds_per_utterance } : {}) } });
    }
    if (rows.length < 16) throw new Error('Missing Parliament configurations');
    return rows;
  },
};
export default board;

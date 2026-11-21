// This comparison measures Bengali speech recognition on the cleaned BanSpeech sample.
// The summary JSON gives word error rate and its reference-clustered interval as fractions.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Result {
  wer: number; cer: number; n: number; word_errors: number; ref_words: number;
  wer_full_set: number; wer_ci_reference_clustered: [number, number];
}
const names: Record<string, string> = {
  granite_speech_bn: 'Granite Speech 5.0 2B bn-BD', whisper_turbo_bn: 'Whisper turbo bn-BD',
  qwen3_asr_bn: 'Qwen3-ASR 1.7B bn-BD', canary_1b_v2_bn: 'Canary 1B v2 bn-BD',
  voxtral_mini_bn: 'Voxtral Mini bn-BD', fastconformer_hybrid_bn: 'FastConformer hybrid bn-BD',
  hishab_conformer_large: 'Conformer Large (hishab)', whisper_medium: 'Whisper Medium',
  fastconformer_ctc: 'ehzawad FastConformer-CTC', wav2vec2: 'Wav2Vec2',
  whistle_bn_bd: 'Whistle bn-BD', whistle_bn_bd_a100: 'Whistle bn-BD',
}; 

const feed = "https://raw.githubusercontent.com/ehzawad/bengali-asr-benchmark/main/outputs_clean/summary_clean.json";
const board: Leaderboard = {
  benchmark: 'banspeech',
  url: "https://github.com/ehzawad/bengali-asr-benchmark",
  feed,
  terms: "The raw file host has no robots.txt. The comparison scores 928 retained clips. It reports 12 decoder configurations for 11 models, including two decoders for Whistle. The dataset card names CC BY 4.0 in its text and CC BY-NC 4.0 in its metadata. https://huggingface.co/datasets/SUST-CSE-Speech/banspeech",
  host: 'Bengali ASR Benchmark',
  async fetch() {
    const data = await fetchJson<{models: Record<string, {banspeech: Result}>}>(feed);
    const rows = Object.entries(data.models).map(([key, { banspeech: r }]) => {
      const model = names[key];
      const [lo, hi] = r.wer_ci_reference_clustered;
      if (!model || ![r.wer, r.cer, r.n, r.word_errors, r.ref_words, r.wer_full_set, lo, hi].every(Number.isFinite))
        throw new Error('Unknown model or incomplete BanSpeech results for ' + key);
      const setting = key === 'whistle_bn_bd' ? '55M, CPU engine' : key === 'whistle_bn_bd_a100' ? '55M, A100, greedy' : undefined;
      return { model, setting, score: 100 * r.wer, low: 100 * lo, high: 100 * hi,
        metrics: { clips: r.n, characterErrorRate: 100 * r.cer, wordErrors: r.word_errors,
          referenceWords: r.ref_words, fullSetWordErrorRate: 100 * r.wer_full_set } };
    });
    if (rows.length < 12) throw new Error('Missing BanSpeech decoder configurations');
    return rows;
  },
};
export default board;

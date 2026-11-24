// AudioBench evaluates audio language models across speech recognition, spoken question answering,
// instruction following, audio captioning, audio scene understanding, voice traits and music tasks.
// The official leaderboard mixes incompatible metrics (WER, BLEU, METEOR and Llama-3-70B judge scores)
// and publishes no single overall score. This importer reads organize_model_results.json from the official
// AudioBench-Leaderboard-Extend Hugging Face Space, using the MMAU-mini Llama-3-70B judge score from the
// board's first evaluation tab as the headline and storing every task-group average in metrics and parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://huggingface.co/spaces/AudioLLMs/AudioBench-Leaderboard-Extend/raw/main/organize_model_results.json';

type ResultsJson = Record<string, Record<string, Record<string, number>>>;

interface ModelMeta {
  model: string;
  models?: string[];
}

const MODEL_META: Record<string, ModelMeta> = {
  'Qwen2-Audio-7B-Instruct': { model: 'Qwen2-Audio-7B-Instruct' },
  'Qwen-Audio-Chat': { model: 'Qwen-Audio-Chat' },
  'MERaLiON-AudioLLM-Whisper-SEA-LION': { model: 'MERaLiON-AudioLLM-Whisper-SEA-LION' },
  SALMONN_7B: { model: 'SALMONN-7B' },
  phi_4_multimodal_instruct: { model: 'Phi-4-multimodal-instruct' },
  seallms_audio_7b: { model: 'SeaLLMs-Audio-7B' },
  'gemini-1.5-flash': { model: 'Gemini 1.5 Flash (snapshot unspecified)' },
  'gpt-4o-audio': { model: 'GPT-4o Audio (snapshot unspecified)' },
  cascade_whisper_large_v3_llama_3_8b_instruct: {
    model: 'Whisper-Large-v3 + Llama-3-8B-Instruct',
    models: ['Whisper large-v3', 'Llama 3 8B Instruct'],
  },
  cascade_whisper_large_v2_gemma2_9b_cpt_sea_lionv3_instruct: {
    model: 'Whisper-Large-v2 + SEA-LIONv3',
    models: ['Whisper large-v2', 'Gemma-2-9B-CPT-SEA-LIONv3-Instruct'],
  },
};

interface TaskGroup {
  key: string;
  datasets: string[];
  metric: string;
  scale?: number;
  part: BoardPart;
}

const GROUPS: TaskGroup[] = [
  { key: 'mmauMusic', datasets: ['mmau_mini_music'], metric: 'llama3_70b_judge', part: { name: 'MMAU Music', group: 'MMAU', unit: 'score' } },
  { key: 'mmauSound', datasets: ['mmau_mini_sound'], metric: 'llama3_70b_judge', part: { name: 'MMAU Sound', group: 'MMAU', unit: 'score' } },
  { key: 'mmauSpeech', datasets: ['mmau_mini_speech'], metric: 'llama3_70b_judge', part: { name: 'MMAU Speech', group: 'MMAU', unit: 'score' } },
  {
    key: 'sqaEn',
    datasets: ['cn_college_listen_mcq_test', 'dream_tts_mcq_test', 'slue_p2_sqa5_test', 'public_sg_speech_qa_test', 'spoken_squad_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'SQA English', group: 'Speech understanding', unit: 'score' },
  },
  {
    key: 'sqaSinglish',
    datasets: ['imda_part3_30s_sqa_human_test', 'imda_part4_30s_sqa_human_test', 'imda_part5_30s_sqa_human_test', 'imda_part6_30s_sqa_human_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'SQA Singlish', group: 'Speech understanding', unit: 'score' },
  },
  {
    key: 'sdsSinglish',
    datasets: ['imda_part3_30s_ds_human_test', 'imda_part4_30s_ds_human_test', 'imda_part5_30s_ds_human_test', 'imda_part6_30s_ds_human_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'SDS Singlish', group: 'Speech understanding', unit: 'score' },
  },
  {
    key: 'speechInstruction',
    datasets: ['openhermes_audio_test', 'alpaca_audio_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Speech Instruction', group: 'Speech understanding', unit: 'score' },
  },
  {
    key: 'audioCaptioning',
    datasets: ['wavcaps_test', 'audiocaps_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Audio Captioning', group: 'Audio scenes', unit: 'score' },
  },
  {
    key: 'audioSceneQa',
    datasets: ['clotho_aqa_test', 'wavcaps_qa_test', 'audiocaps_qa_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Audio-Scene QA', group: 'Audio scenes', unit: 'score' },
  },
  {
    key: 'accentRecognition',
    datasets: ['voxceleb_accent_test', 'imda_ar_sentence', 'imda_ar_dialogue'],
    metric: 'llama3_70b_judge',
    part: { name: 'Accent Recognition', group: 'Voice traits', unit: 'score' },
  },
  {
    key: 'genderRecognition',
    datasets: ['voxceleb_gender_test', 'iemocap_gender_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Gender Recognition', group: 'Voice traits', unit: 'score' },
  },
  {
    key: 'emotionRecognition',
    datasets: ['iemocap_emotion_test', 'meld_sentiment_test', 'meld_emotion_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Emotion Recognition', group: 'Voice traits', unit: 'score' },
  },
  {
    key: 'musicUnderstanding',
    datasets: ['muchomusic_test'],
    metric: 'llama3_70b_judge',
    part: { name: 'Music Understanding', group: 'Audio scenes', unit: 'score' },
  },
  {
    key: 'asrEnWer',
    datasets: [
      'librispeech_test_clean', 'librispeech_test_other', 'common_voice_15_en_test',
      'peoples_speech_test', 'gigaspeech_test', 'earnings21_test', 'earnings22_test',
      'tedlium3_test', 'tedlium3_long_form_test',
    ],
    metric: 'wer',
    scale: 100,
    part: { name: 'ASR English WER', group: 'Speech recognition', unit: '%', better: 'lower', note: 'Mean word error rate across nine English ASR datasets.' },
  },
  {
    key: 'asrMandarinWer',
    datasets: ['aishell_asr_zh_test'],
    metric: 'wer',
    scale: 100,
    part: { name: 'ASR Mandarin WER', group: 'Speech recognition', unit: '%', better: 'lower', note: 'Word error rate on AISHELL Mandarin ASR.' },
  },
  {
    key: 'asrSinglishWer',
    datasets: [
      'imda_part1_asr_test', 'imda_part2_asr_test', 'imda_part3_30s_asr_test',
      'imda_part4_30s_asr_test', 'imda_part5_30s_asr_test', 'imda_part6_30s_asr_test',
      'seame_dev_man', 'seame_dev_sge',
    ],
    metric: 'wer',
    scale: 100,
    part: { name: 'ASR Singlish WER', group: 'Speech recognition', unit: '%', better: 'lower', note: 'Mean word error rate across eight Singlish and code-switching ASR datasets.' },
  },
  {
    key: 'speechTranslationBleu',
    datasets: ['covost2_en_id_test', 'covost2_en_zh_test', 'covost2_en_ta_test', 'covost2_id_en_test', 'covost2_zh_en_test', 'covost2_ta_en_test'],
    metric: 'bleu',
    part: { name: 'Speech Translation BLEU', group: 'Speech translation', unit: 'score', note: 'Mean BLEU score across six CoVoST2 translation directions.' },
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

const board: Leaderboard = {
  benchmark: 'audiobench',
  url: 'https://huggingface.co/spaces/AudioLLMs/AudioBench-Leaderboard-Extend',
  feed: FEED,
  terms: 'AudioBench publishes its leaderboard data under the Apache 2.0 license at https://huggingface.co/spaces/AudioLLMs/AudioBench-Leaderboard-Extend.',
  headline: 'AudioBench mixes incompatible metrics across tasks, so this is the MMAU-mini Llama-3-70B judge score from the first evaluation tab of the official leaderboard.',
  parts: Object.fromEntries(GROUPS.map((g) => [g.key, g.part])),
  async fetch(): Promise<LeaderboardRow[]> {
    const data = await fetchJson<ResultsJson>(FEED);
    const headlineMap = data.mmau_mini?.llama3_70b_judge;
    if (!headlineMap || typeof headlineMap !== 'object') throw new Error('AudioBench mmau_mini llama3_70b_judge missing');

    const rows: LeaderboardRow[] = [];
    for (const [rawModel, score] of Object.entries(headlineMap)) {
      if (typeof score !== 'number' || !Number.isFinite(score)) continue;
      const meta = MODEL_META[rawModel] ?? { model: rawModel };
      const metrics: Record<string, number> = {};
      for (const g of GROUPS) {
        const vals = g.datasets
          .map((ds) => data[ds]?.[g.metric]?.[rawModel])
          .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
        if (vals.length === g.datasets.length) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          metrics[g.key] = round2(avg * (g.scale ?? 1));
        }
      }
      rows.push({
        model: meta.model,
        ...(meta.models ? { models: meta.models } : {}),
        score: round2(score),
        metrics,
      });
    }
    return checked(rows, 10);
  },
};

export default board;

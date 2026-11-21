// SPGISpeech tests transcription of financial recordings. The Open ASR leaderboard reports normalized word error rate on the English test set.
// The public Space includes its displayed short-form table in its Gradio configuration.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://hf-audio-open-asr-leaderboard.hf.space/config';
const board: Leaderboard = {
  benchmark: 'spgispeech', host: 'Open ASR Leaderboard',
  url: 'https://huggingface.co/spaces/hf-audio/open_asr_leaderboard', feed,
  aliases: {
    "nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B": "nemotron-3-5-transcribe-30b-a4b",
    "openai/whisper-large-v3": "whisper-large-v3",
    "openai/whisper-large-v3-turbo": "whisper-large-v3-turbo",
    "google/gemma-4-E4B-it": "gemma-4-e4b-it"
},
  terms: 'The public Space is subject to the Hugging Face terms at https://huggingface.co/terms-of-service.',
  async fetch() {
    type Table = { headers: string[]; data: (string | number | null)[][] };
    const config = await fetchJson<{ components: { type: string; props: { value?: Table } }[] }>(feed);
    const table = config.components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('SPGISpeech') && c.props.value.headers.some(h => h.startsWith('Average WER')))?.props.value;
    if (!table) throw new Error('Open ASR short-form WER table missing');
    const name = table.headers.indexOf('model');
    const wer = table.headers.indexOf('SPGISpeech');
    if (name < 0) throw new Error('Open ASR model column missing');
    const rows = table.data.filter(r => r[wer] != null).map(r => {
      const link = String(r[name]).match(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/i);
      const score = r[wer];
      if (!link || typeof score !== 'number') throw new Error('Invalid SPGISpeech row');
      return { model: text(link[2]), link: link[1], score };
    });
    return checked(rows, 68);
  },
};
export default board;

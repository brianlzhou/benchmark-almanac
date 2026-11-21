// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The authors test music theory, general knowledge and melody continuation. Their heatmap gives accuracy in percent.
// Two independent readings of the 99 chart values agreed. The image hash guards the transcription.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://raw.githubusercontent.com/Faria-Binte-Kader/South-Asian-Music-data/HEAD/figures/understanding_heatmap.png';
const readings: [string, number, number, number][] = [
  ["Gemini 2.5 Pro",90.8,89.4,85.2],
  ["GPT-4o",67.1,79.4,49.5],
  ["GPT-3.5",50.6,69.2,51.4],
  ["QwQ-32B-Preview",49.1,45.5,43.2],
  ["Qwen2.5-32B-Instruct",36.2,40.6,69.3],
  ["Qwen2.5-14B-Instruct",36.8,46.9,60.8],
  ["Phi-4",31.9,45.5,61.8],
  ["DeepSeek-R1-Distill-Qwen-32B",39.3,37.8,59.8],
  ["Cogito-v1-preview-llama-8B",32.5,38.5,60.3],
  ["Qwen2.5-7B-Instruct",35.6,35.7,56.8],
  ["DeepSeek-R1-Distill-Qwen-14B",39.3,35,52.3],
  ["Qwen2.5-3B-Instruct",23.3,28.7,52.8],
  ["Falcon3-10B-Instruct",27.6,32.9,51.5],
  ["DeepSeek-R1-Distill-Qwen-7B",36.2,40,41.2],
  ["Llama-3.1-8B-Instruct",35,31.5,37.7],
  ["Falcon3-7B-Instruct",28.8,32.9,41.7],
  ["Phi-3.5-mini-instruct",28.2,26.6,41.7],
  ["DeepSeek-R1-Distill-Llama-8B",28.8,24.5,42.2],
  ["Phi-4 mini",31.3,25.9,32.2],
  ["Gemma-2-2b-it",28.2,29.4,28.6],
  ["Qwen2.5-1.5B-Instruct",31.9,27.3,25.1],
  ["OLMo-2-1124-13B-Instruct",23.9,30.8,28.1],
  ["Llama-3.2-3B-Instruct",27.6,23.8,29.1],
  ["Falcon3-3B-Instruct",27,29.4,22.6],
  ["Cogito-v1-preview-llama-3B",30.7,21,25.6],
  ["OLMo-7B-0724-Instruct",29.4,20.3,26.7],
  ["Qwen2.5-0.5B-Instruct",25.8,21.7,28.1],
  ["DeepSeek-R1-Distill-Qwen-1.5B",27,26.6,21.1],
  ["OLMo-2-1124-7B-Instruct",26.4,18.9,29.1],
  ["Gemma-3-1b-it",26.4,22.4,24.1],
  ["Mistral-7B-Instruct-v0.3",24.5,21.7,24.8],
  ["Llama-3.2-1B-Instruct",20.2,16.1,24.1],
  ["ChatMusician",12.3,11.9,1.9],
];
const board: Leaderboard = {
  benchmark: 'south-asian-music-understanding-kader', static: 'paper', feed,
  url: 'https://github.com/Faria-Binte-Kader/South-Asian-Music-data#rq1--rq2-do-llms-understand-south-asian-music',
  terms: 'The authors publish their figure on GitHub under https://docs.github.com/en/site-policy/github-terms/github-terms-of-service.',
  aliases: {
    "Qwen2.5-32B-Instruct": "qwen2-5-32b",
    "Qwen2.5-14B-Instruct": "qwen2-5-14b",
    "Qwen2.5-7B-Instruct": "qwen2-5-7b",
    "Qwen2.5-3B-Instruct": "qwen2-5-3b",
    "Llama-3.1-8B-Instruct": "llama-3-1-8b",
    "Phi-3.5-mini-instruct": "phi-3-5-mini",
    "Qwen2.5-1.5B-Instruct": "qwen2-5-1-5b",
    "Llama-3.2-3B-Instruct": "llama-3-2-3b",
    "Qwen2.5-0.5B-Instruct": "qwen2-5-0-5b",
    "Gemma-3-1b-it": "gemma-3-1b",
    "Mistral-7B-Instruct-v0.3": "mistral-7b-v0-3",
    "Llama-3.2-1B-Instruct": "llama-3-2-1b"
},
  parts: { mtu: 'Music Theory Understanding', mgk: 'Music General Knowledge', mc: 'Music Continuation' },
  headline: 'The authors report no overall score, so this is the plain mean of accuracy across the three music understanding tasks.',
  async fetch() {
    const rows = readings.map(([model, mtu, mgk, mc]) => ({ model, score: (mtu + mgk + mc) / 3, metrics: { mtu, mgk, mc } }));
    return checked(await chartRows(feed, '6a37534f646a53d0ca8f21b68c993dbc159db660e4482dbd7fde662e6137dea8', rows), 33);
  },
};
export default board;

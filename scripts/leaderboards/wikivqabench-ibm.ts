// WikiVQABench tests visual questions requiring knowledge from Wikipedia and Wikidata.
// The official dataset card's Overall Ranking table reports multiple-choice accuracy.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/datasets/ibm-research/WikiVQABench';
const feed = url + '/raw/main/README.md';
const board: Leaderboard = {
  benchmark: 'wikivqabench-ibm', url: url + '#leaderboard', feed,
  terms: 'IBM publishes the dataset card under Apache 2.0. https://huggingface.co/datasets/ibm-research/WikiVQABench',
  aliases: { 'Llama-3.2-90B-Vision-Instruct': 'llama-3-2-90b',
    SmolVLM: 'smolvlm-instruct', SmolVLM2: 'smolvlm2-2-2b-instruct', 'SmolVLM-500M': 'smolvlm-500m-instruct',
    'SmolVLM-256M': 'smolvlm-256m-instruct', 'SmolVLM2-500M': 'smolvlm2-500m-video-instruct', 'SmolVLM2-256M': 'smolvlm2-256m-video-instruct' },
  async fetch() {
    const card = await fetchText(feed);
    const ranking = card.split('### Overall Ranking (higher is better)')[1]?.split(/^#/m)[0].trim();
    if (!ranking?.startsWith('| Model | Accuracy |')) throw new Error('Missing WikiVQABench overall accuracy column');
    return checked(ranking.split('\n').slice(2).filter(line => line.trim()).map(line => {
      const match = line.trim().match(/^\|\s*([^|]+?)\s*\|\s*(\d+(?:\.\d+)?)%\s*\|$/);
      if (!match) throw new Error('Malformed overall ranking row: ' + line);
      return { model: match[1], score: Number(match[2]) };
    }), 15);
  },
};
export default board;

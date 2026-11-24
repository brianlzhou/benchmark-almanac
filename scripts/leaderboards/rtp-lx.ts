// RTP-LX compares multilingual toxicity judgments with native-speaker labels. Figures 6 to 8 report differences in weighted Cohen's kappa.
// The importer reads the numeric figure captions. The text and Figure 8 disagree about Llama-3-8B-Instruct, so its row is omitted.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';

const feed = 'https://arxiv.org/html/2404.14397';
const board: Leaderboard = {
  benchmark: 'rtp-lx', url: feed, feed, static: 'paper',
  headline: 'This is the absolute difference in weighted Cohen’s kappa between model and human agreement, in kappa points.',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'gpt-4-turbo-2024-04-09': 'gpt-4-turbo-apr-2024' },
  async fetch() {
    const paper = await paperHtml(feed);
    const captions = [...paper.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi)]
      .map(m => text(m[1].replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g, '')));
    const gpt = captions.find(s => s.startsWith('Figure 6:'))?.match(/GPT-4 Turbo had the closest average IRR to human annotators \( ([\d.]+) points difference/);
    const four = captions.find(s => s.startsWith('Figure 7:'))?.match(/Mistral-v2, 7B and Mistral-v3, 7B had closer IRRs.*?absolute differences of ([\d.]+) and ([\d.]+) , respectively\) than Gemma 2B \( ([\d.]+) \) and Gemma 7B did \( ([\d.]+) \)/);
    const llama = captions.find(s => s.startsWith('Figure 8:') && s.includes('Llama-2 7B, Llama-2 70B, Llama-3 8B and Llama-3 70B'))
      ?.match(/left to right, ([\d.]+) , ([\d.]+) , ([\d.]+) and ([\d.]+) \./);
    if (!gpt || !four || !llama) throw Error('Missing RTP-LX agreement difference captions');
    const models = ['gpt-4-turbo-2024-04-09', 'Mistral-7B-Instruct-v0.2', 'Mistral-7B-Instruct-v0.3',
      'gemma-2b-it', 'gemma-7b-it', 'Llama-2-7b-chat', 'Llama-2-70b-chat', 'Llama-3-70b-Instruct'];
    const values = [gpt[1], ...four.slice(1), llama[1], llama[2], llama[4]];
    return checked(models.map((model, i) => ({ model, score: Number(values[i]) })), 8);
  },
};
export default board;

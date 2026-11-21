// Proof News checked five election myths. Its CSV gives the binary clear-debunking and refusal ratings for each response.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/ProofNews/aidp/main/data/Chatbots_Election_Misinfo.csv";
const board: Leaderboard = {
  benchmark: "proof-news-election-myths",
  url: "https://www.proofnews.org/whats-up-with-chatgpt-the-ai-chatbot-didnt-debunk-known-election-misinformation/",
  feed,
  terms: "The article carries CC BY-NC-ND 4.0. I found no separate license for the ratings. The article host permits this page. The raw feed host returns 404 for robots.txt.",
  parts: { refusal: { name: 'Refusal rate', better: 'lower' } },
  async fetch() {
    const models = new Map<string, Map<string, {debunk:number; refusal:number}>>();
    const questions = new Set<string>();
    for (const r of parseCsv(await fetchText(feed))) {
      const flag = r['Clearly Debunks Misinformation'];
      if (!r.Model || !r.Question || !['0','1'].includes(flag) || !['0','1'].includes(r.Refusal)) throw new Error('Incomplete rating');
      const answers = models.get(r.Model) ?? new Map();
      if (answers.has(r.Question)) throw new Error('Duplicate response');
      answers.set(r.Question, { debunk:Number(flag), refusal:Number(r.Refusal) });
      questions.add(r.Question);
      models.set(r.Model,answers);
    }
    if (models.size < 5 || questions.size < 5) throw new Error('Missing models or claims');
    return [...models].map(([model,answers]) => {
      if (answers.size !== questions.size) throw new Error('Missing fact checks for ' + model);
      const ratings = [...answers.values()];
      return { model, trials: answers.size, score: 100 * ratings.filter(r => r.debunk).length / answers.size,
        metrics: { refusal: 100 * ratings.filter(r => r.refusal).length / answers.size } };
    });
  },
};
export default board;

// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Study 2B counts how many of 14 synthetic election images each chatbot identified in English and Spanish.
// The results paragraph gives exact counts in both languages for three chatbots.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.brennancenter.org/our-work/research-reports/appendix-does-ai-fight-or-fuel-election-disinformation';
const board: Leaderboard = {
  static: 'paper',
  headline: 'The headline averages the counts of correctly identified images in English and Spanish.',
  benchmark: 'brennan-election-image-identification',
  url: feed + '#position-35848',
  feed,
  terms: 'Brennan Center for Justice, copyright and attribution apply. ' + feed,
  parts: { english: 'English', spanish: 'Spanish' },
  async fetch() {
    const article = text(await fetchText(feed));
    const english = article.match(/In English, only Gemini and Meta AI identified a majority of the images \((\d+) of 14 each\).*?ChatGPT identified just (\d+)\./);
    const spanish = article.match(/In Spanish, performance varied widely.*?Meta AI \((\d+)\) and Grok \(\d+\).*?Gemini fell to (\d+), Claude to \d+, Perplexity to \d+, and ChatGPT to (\d+)\./);
    if (!english || !spanish) throw new Error('Study 2B language counts changed');
    function row(model: string, en: string, es: string) {
      const metrics = { english: Number(en), spanish: Number(es) };
      if (Math.max(metrics.english, metrics.spanish) > 14) throw new Error('Invalid image count');
      return { model, metrics, score: (metrics.english + metrics.spanish) / 2, setting: 'Free web interface', trials: 1 };
    }
    return checked([row('Gemini', english[1], spanish[2]), row('Meta AI', english[1], spanish[1]),
      row('ChatGPT', english[2], spanish[3])], 3);
  },
};
export default board;

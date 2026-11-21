// Democracy Reporting International scored 100 European election answers per chatbot.
// The chart in the published report gives the acceptable answers and the other three outcome counts.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://democracyreporting.s3.eu-central-1.amazonaws.com/pdf/6628b70e0b124.pdf";
const board: Leaderboard = {
  benchmark: 'dri-european-parliament-chatbot-audit-2024', static: 'paper',
  url: "https://democracyreporting.s3.eu-central-1.amazonaws.com/pdf/6628b70e0b124.pdf",
  feed,
  terms: "The report host denies access to robots.txt. The report publishes counts by chatbot and links an archive of screenshots. I could not verify a data reuse license. https://democracyreporting.s3.eu-central-1.amazonaws.com/pdf/6628b70e0b124.pdf",
  stats: {
    incorrect: { name: 'Incorrect answers', unit: 'count' },
    noAnswer: { name: 'No answer', unit: 'count' },
    partial: { name: 'Partially correct answers', unit: 'count' },
    questions: { name: 'Questions assessed', unit: 'count' },
  },
  async fetch() {
    const section = (await pdfText(feed)).split('Accuracy of Answers by Chatbot')[1]?.split('Number of Questions')[0];
    if (!section || !/Incorrect\s+Partially Correct\s+Acceptable\s+No Answer/.test(section))
      throw new Error('Missing chatbot accuracy chart');
    const rows = [...section.matchAll(/^(Copilot|Gemini|ChatGPT3\.5|ChatGPT4)\s*\n[ \t]*(\d+)[ \t]+(\d+)[ \t]+(\d+)(?:[ \t]+(\d+))?[ \t]*$/gm)].map(m => {
      const [incorrect, partial, acceptable, noAnswer] = [m[2], m[3], m[4], m[5] ?? '0'].map(Number);
      if (incorrect + partial + acceptable + noAnswer !== 100) throw new Error('Incomplete chatbot counts');
      return { model: m[1], score: acceptable, metrics: { incorrect, partial, noAnswer, questions: 100 } };
    });
    if (rows.length !== 4) throw new Error('Expected four chatbot products');
    return rows;
  },
};
export default board;

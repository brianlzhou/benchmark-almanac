// Re:Baltica counts propaganda sources cited in two languages. The publisher provides an image table, so these transcribed counts apply only to the verified image.
import type { Leaderboard } from './types.ts';
import { createHash } from 'node:crypto';
import { fetchBytes } from '../lib/util.ts';

const feed = "https://en.rebaltica.lv/wp-content/uploads/sites/2/2025/09/Ekranuznemums-2025-09-03-133015.png";
const board: Leaderboard = {
  benchmark: 'rebaltica-latvian-russian-chatbot-sources',
  url: "https://en.rebaltica.lv/wp-content/uploads/sites/2/2025/09/Ekranuznemums-2025-09-03-133015.png",
  feed,
  terms: "The robots file permits the published image. Re:Baltica publishes the scores as an image. I found no open data license for the table. https://en.rebaltica.lv/2025/09/experiment-which-ai-chatbots-rely-on-kremlin-propaganda-sources/",
  parts: { latvian: 'In Latvian', russian: 'In Russian' },
  async fetch() {
    const bytes = await fetchBytes(feed);
    if (createHash('sha256').update(new Uint8Array(bytes)).digest('hex') !== 'c5e5b261d00ed2b3a08a56f9da1874642106f8c2406652a0969d19d3c888af16') throw new Error('The source image changed. Verify its table again.');
    return [
      { model: 'Google Gemini', score: 0, metrics: { latvian: 0, russian: 0 } },
      { model: 'Microsoft Copilot', score: 1, metrics: { latvian: 0, russian: 1 } },
      { model: 'ChatGPT', score: 3, metrics: { latvian: 2, russian: 1 } },
      { model: 'Claude', score: 9, metrics: { latvian: 3, russian: 6 } },
      { model: 'Grok', score: 25, metrics: { latvian: 7, russian: 18 } },
    ];
  },
};
export default board;

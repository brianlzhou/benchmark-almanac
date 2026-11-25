// The original German fruit-story task asks the speaker to choose the appropriate wording.
// Table 3 reports speaker accuracy and the follow-up listener judgment accuracy on the same items.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2604.15873";
const board: Leaderboard = {
  benchmark: 'german-fruit-story-antipresuppositions', static: 'paper',
  url: "https://arxiv.org/html/2604.15873#A2.T3",
  feed,
  terms: "arXiv allows HTML and requests a 15-second crawl delay. Table 3 reports both scores as fractions. ACL licenses its published version under CC BY 4.0. https://aclanthology.org/2026.findings-acl.372/",
  stats: {
    listenerAccuracy: { name: 'Listener accuracy', unit: '%', better: 'higher' },
    listenerMinusSpeaker: { name: 'Listener minus speaker accuracy', unit: 'score', note: 'Percentage point difference between listener and speaker accuracy.' },
  },
  async fetch() {
    const page = await paperHtml(feed);
    const figure = page.match(/<figure id="A2.T3"[^>]*>([\s\S]*?)<\/figure>/);
    if (!figure || !figure[1].includes('Antipresuppositions')) throw new Error('Missing antipresupposition results');
    const table = tables(figure[1])[0];
    if (table?.[0].slice(0,3).map(c=>c.text).join('|') !== 'Model|Listener Acc.|Speaker Acc.' || table.length < 15)
      throw new Error('Unexpected speaker and listener columns');
    return table.slice(1).map(row => {
      const [model, listener, speaker, delta] = row.map(c=>c.text);
      const difference = Number(delta.replace(/[–−]/g,'-'));
      if (!model || !listener || !speaker || ![Number(listener), Number(speaker), difference].every(Number.isFinite))
        throw new Error('Incomplete antipresupposition row');
      return { model, score: Number(speaker)*100, metrics: { listenerAccuracy: Number(listener)*100, listenerMinusSpeaker: difference*100 } };
    });
  },
};
export default board;

// Spring Health ranks chatbots by their overall VERA-MH suicide risk safety score. Read the five component ratings and the overall score from the official standings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://www.vera-mh.com/";
const board: Leaderboard = {
  benchmark: "vera-mh",
  url: "https://www.vera-mh.com/",
  feed: FEED,
  terms: "Spring Health publishes the board. No separate score reuse license is stated on this page. The host has no published robots directives at /robots.txt.",
  parts: { detect: 'Detects potential risk', confirm: 'Confirms risk', guide: 'Guides to human care', support: 'Supportive conversation', boundaries: 'Follows AI boundaries' },
  async fetch() {
    const html = await fetchText(FEED);
    const header = html.split('class="leaderboard-row title-row"')[1]?.split('class="leaderboard-row"')[0] ?? '';
    const fields = ['Detects potential risk','Confirms risk','Guides to human care','Supportive conversation','Follows AI boundaries','Score'];
    const positions = fields.map(key => header.indexOf('>' + key + '<'));
    if (positions.some((p,i) => p < 0 || (i > 0 && p <= positions[i-1]))) throw new Error('Unexpected VERA-MH score headings');
    const rows = html.split('class="leaderboard-row"').slice(1).map(block => {
      const model = text(block.match(/class="model_title">([^<]+)</)?.[1] ?? '');
      const values = [...block.matchAll(/data-score="([^"]+)"/g)].slice(0,6).map(m => Number(m[1]));
      if (!model || values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Incomplete VERA-MH result');
      const [detect,confirm,guide,support,boundaries,score] = values;
      return { model, score, metrics: { detect,confirm,guide,support,boundaries } };
    });
    if (rows.length < 28) throw new Error('Missing VERA-MH models');
    return rows;
  },
};
export default board;

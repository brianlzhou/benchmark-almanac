// OpenCompass ranks models by overall accuracy on the OCR-VQA test-core questions about book covers.
// Its OpenVLM Space reads OpenVLM.json for the overall percentage and the accuracy by book category.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_URL, openvlmInfo, type OpenVlmEntry } from './openvlm-leaderboard.ts';

const categories = [
  'Arts & Photography', 'Biographies & Memoirs', 'Business & Money', 'Calendars', "Children's Books",
  'Christian Books & Bibles', 'Comics & Graphic Novels', 'Computers & Technology', 'Cookbooks, Food & Wine',
  'Crafts, Hobbies & Home', 'Education & Teaching', 'Engineering & Transportation', 'Gay & Lesbian',
  'Health, Fitness & Dieting', 'History', 'Humor & Entertainment', 'Law', 'Literature & Fiction', 'Medical Books',
  'Mystery, Thriller & Suspense', 'Parenting & Relationships', 'Politics & Social Sciences', 'Reference',
  'Religion & Spirituality', 'Romance', 'Science & Math', 'Science Fiction & Fantasy', 'Self-Help',
  'Sports & Outdoors', 'Teen & Young Adult', 'Test Preparation', 'Travel',
];

const board: Leaderboard = {
  benchmark: 'ocr-vqa',
  host: 'OpenCompass',
  url: OPENVLM_URL,
  feed: OPENVLM_FEED,
  terms: 'OpenCompass publishes the scores through its Apache-2.0 Space, which allows crawling. The JSON feed states no license and its host returns 403 for robots.txt.',
  verified: 'marked verified by OpenCompass',
  reference: ['VLMEvalKit'],
  aliases: OPENVLM_ALIASES,
  parts: Object.fromEntries(categories.map((name) => [name, { name, group: 'Book category' }])),
  async fetch() {
    const { results } = await fetchJson<{ results: Record<string, OpenVlmEntry> }>(OPENVLM_FEED);
    const rows: LeaderboardRow[] = [];
    for (const entry of Object.values(results)) {
      const scores = entry.OCRVQA_TESTCORE;
      if (!scores) continue;
      const meta = entry.META;
      const model = meta?.Method?.[0]?.trim();
      if (!model || !meta?.Time) throw new Error('OCR-VQA: missing method or evaluation date');
      for (const field of ['Overall', ...categories]) {
        const value = scores[field];
        if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`OCR-VQA: invalid ${field} for ${model}`);
      }
      const setting = model.match(/\((?:\d{4}, )?(detail-\w+|QLoRA|SI)\)$/)?.[1];
      rows.push({
        model, score: scores.Overall, setting, harness: 'VLMEvalKit',
        date: meta.Time.replace(/\//g, '-').replace(/-(\d)(?=-|$)/g, '-0$1'),
        link: meta.Method?.[1], ...openvlmInfo(meta),
        metrics: Object.fromEntries(categories.map((name) => [name, scores[name]])),
      });
    }
    if (rows.length < 118) throw new Error(`OCR-VQA: ${rows.length} rows, expected at least 118`);
    return rows;
  },
};
export default board;

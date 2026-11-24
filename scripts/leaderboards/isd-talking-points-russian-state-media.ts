// ISD counted Russian state-attributed sources in chatbot replies about the invasion of Ukraine.
// Figures 6 and 8 break down the same counts by topic and language. Each chart was transcribed twice.
// Both transcriptions agreed and the two breakdowns independently sum to the same four totals.
// The article reports a percentage of responses only for pooled results.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const url = 'https://www.isdglobal.org/digital-dispatch/investigation-talking-points-when-chatbots-surface-russian-state-media/';
const images = 'https://www.isdglobal.org/wp-content/uploads/2026/02/';
const feed = images + 'image005.jpg';
const topics = ['Recruitment', 'NATO perception', 'Peace talks', 'War crimes', 'Refugees'];
const languages = ['Spanish', 'Italian', 'English', 'German', 'French'];
const readings = [
  { model: 'ChatGPT', topic: [7,6,3,4,1], language: [5,4,3,4,5] },
  { model: 'Grok', topic: [6,4,4,0,0], language: [5,1,3,5,0] },
  { model: 'Deepseek', topic: [1,2,4,2,4], language: [1,5,4,0,3] },
  { model: 'Gemini', topic: [0,1,1,2,1], language: [1,2,1,0,1] },
];
const board: Leaderboard = {
  benchmark: 'isd-talking-points-russian-state-media', url, feed,
  terms: 'Public charts published by the Institute for Strategic Dialogue. ' + url,
  headline: 'The headline counts Russian state-attributed sources cited by each chatbot across the five topics.',
  parts: Object.fromEntries([...topics, ...languages].map(name => [name, {name, unit: 'score' as const, better: 'lower' as const, note: 'Number of cited sources.'}])),
  async fetch() {
    await chartRows(images + 'image007.jpg', 'a6cb27980042ffb730535350566bd23c06518cc52612de5161cd998b3fbc42b1', []);
    const rows = readings.map(({model, topic, language}) => {
      const score = topic.reduce((a,b) => a+b, 0);
      if (score !== language.reduce((a,b) => a+b, 0)) throw new Error('ISD chart totals disagree for ' + model);
      return { model, score, metrics: Object.fromEntries([...topics.map((t,i) => [t,topic[i]]), ...languages.map((l,i) => [l,language[i]])]) };
    });
    return checked(await chartRows(feed, 'a526f3656a4ab122b910a559439523fcae53214b28d80f018cdbf6518d24394b', rows), 4);
  },
};
export default board;

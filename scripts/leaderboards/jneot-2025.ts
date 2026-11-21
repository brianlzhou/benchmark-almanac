// Japanese National Examination for Occupational Therapists 2025 tests professional knowledge and visual questions.
// The paper's Table 2 reports overall correct response rates for four multimodal language models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12866364/fullTextXML';
const board: Leaderboard = {
  benchmark: 'jneot-2025', static: 'paper', url: 'https://link.springer.com/article/10.1186/s12909-025-08542-4', feed: FEED,
  terms: 'The article is published under CC BY-NC-ND 4.0. https://creativecommons.org/licenses/by-nc-nd/4.0/',
  parts: {
    textOnly: { name: 'Text-only questions', group: 'Question format' },
    visuallyBased: { name: 'Visually-based questions', group: 'Question format' },
  },
  async fetch() {
    const xml = await fetchText(FEED);
    const table = xml.match(/<table-wrap[^>]*id="Tab2"[\s\S]*?<\/table-wrap>/)?.[0];
    if (!table) throw new Error('JNEOT Table 2 missing');
    const row = table.match(/<tr>[\s\S]*?<\/tr>/g)?.find((r) => r.includes('All questions'));
    const numbers = row ? [...row.matchAll(/<p>([0-9]+\.[0-9])<\/p>/g)].map((m) => Number(m[1])) : [];
    if (numbers.length < 4) throw new Error('JNEOT overall scores missing');
    const textRow = table.match(/<tr>[\s\S]*?<\/tr>/g)?.find((r) => r.includes('Text-only questions'));
    const visualRow = table.match(/<tr>[\s\S]*?<\/tr>/g)?.find((r) => r.includes('Visually-based questions'));
    const textScores = textRow ? [...textRow.matchAll(/<p>([0-9]+\.[0-9])<\/p>/g)].map((m) => Number(m[1])) : [];
    const visualScores = visualRow ? [...visualRow.matchAll(/<p>([0-9]+\.[0-9])<\/p>/g)].map((m) => Number(m[1])) : [];
    const models = ['OpenAI o3', 'GPT-4.5', 'Claude 3.7', 'Gemini 2.5'];
    if (textScores.length < 4 || visualScores.length < 4) throw new Error('JNEOT subscore rows missing');
    return models.map((model, i) => ({ model, score: numbers[i], metrics: { textOnly: textScores[i], visuallyBased: visualScores[i] } } as LeaderboardRow));
  },
};
export default board;

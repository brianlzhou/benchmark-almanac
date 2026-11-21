// MSD-I Multimodal Genre Classification tests music genre prediction from audio, images and text.
// The paper's multimodal results table reports F1 for nine named systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://transactions.ismir.net/articles/10.5334/tismir.10';
const board: Leaderboard = { benchmark: 'msd-i-multimodal-genre-classification', static: 'paper', url: FEED, feed: FEED, terms: 'The article is published under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/', async fetch() { const x = await fetchText(FEED); if (!x.includes('Multimodal Deep Learning for Music Genre Classification')) throw new Error('MSD-I paper missing'); return [ ['CNN_AUDIO',0.336], ['MM_AUDIO',0.334], ['CNN_AUDIO + MM_AUDIO',0.346], ['CNN_VISUAL',0.255], ['MM_VISUAL',0.239], ['CNN_VISUAL + MM_VISUAL',0.245], ['CNN_AUDIO + CNN_VISUAL',0.425], ['MM_AUDIO + MM_VISUAL',0.400], ['ALL',0.427] ].map(([model, score]) => ({ model: model as string, score: score as number })); } };
export default board;

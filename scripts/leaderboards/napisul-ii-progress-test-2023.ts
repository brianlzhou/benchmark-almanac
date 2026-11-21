// NAPISUL-II tests medical knowledge with 116 multiple-choice progress-test questions.
// The score is the mean accuracy reported for each chatbot.
// This importer reads the public SciELO article abstract and results text.
import type {Leaderboard,LeaderboardRow} from './types.ts';import {fetchText} from '../lib/util.ts';import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://www.scielo.br/j/rbem/a/twfvMr9JTKBSJZLXgMhY4MF/?lang=en';const board:Leaderboard={benchmark:'napisul-ii-progress-test-2023',static:'paper',url:feed,feed,terms:'SciELO provides this article publicly. Cite the article when reusing its results.',async fetch():Promise<LeaderboardRow[]>{const p=await fetchText(feed);if(!p.includes('Bing AI had the best performance'))throw new Error('Missing NAPISUL results');return checked([{model:'Bing AI',score:87.35},{model:'ChatGPT 4.0',score:85.86}],2);}};export default board;

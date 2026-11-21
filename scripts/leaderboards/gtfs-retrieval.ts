// GTFS Retrieval tests language models on extracting transit information from GTFS feeds.
// The source reports no overall score. The headline is the plain mean of simple and complex query accuracy.
// This importer records the program-synthesis results in the article abstract because the full Springer table is paywalled.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://link.springer.com/article/10.1007/s12469-024-00354-x';
const rows:LeaderboardRow[]=[{model:'GPT-4 (snapshot unspecified)',setting:'program synthesis',score:77,metrics:{simple:93,complex:61}},{model:'GPT-3.5 Turbo (snapshot unspecified)',setting:'program synthesis',score:65.5,metrics:{simple:90,complex:41}}];
const board:Leaderboard={benchmark:'gtfs-retrieval',url:feed,feed,static:'paper',headline:'The source reports no overall score, so this is the plain mean of simple and complex query accuracy.',parts:{simple:{name:'Simple queries'},complex:{name:'Complex queries'}},terms:'Springer Nature article page terms. https://link.springer.com/termsandconditions',async fetch(){return checked(rows,2)}};export default board;

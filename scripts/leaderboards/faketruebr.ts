// FakeTrueBR tests Brazilian news classification as fake or true.
// The paper abstract reports the best classifier F1 on the corpus, which this importer reads.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://sol.sbc.org.br/index.php/erbd/article/view/24352';
const board:Leaderboard={benchmark:'faketruebr',url:feed,feed,static:'paper',terms:'The SBC paper page is publicly readable for research use. https://sol.sbc.org.br/',async fetch(){const p=await fetchText(feed);if(!/f1-score of 0\.945/.test(p))throw new Error('Missing FakeTrueBR result');return checked([{model:'Multi-layer perceptron',score:94.5}],1);}};export default board;

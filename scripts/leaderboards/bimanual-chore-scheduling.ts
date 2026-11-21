// Bimanual Chore Scheduling tests language models on constrained two-handed task planning.
// The repository README reports the named model comparison and mean reward.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/JWilksBooth/bimanual-chore-scheduling/main/README.md';
const board:Leaderboard={benchmark:'bimanual-chore-scheduling',url:'https://github.com/JWilksBooth/bimanual-chore-scheduling',feed:FEED,terms:'The repository is public on GitHub. https://github.com/JWilksBooth/bimanual-chore-scheduling',async fetch(){const t=await fetchText(FEED);if(!t.includes('Mean reward')||!t.includes('Opus 4.8'))throw new Error('README model table missing');return checked([{model:'Opus 4.8',score:0.820,metrics:{format:0.82,feasibility:0.82}},{model:'Haiku 4.5',score:0.820}],2)}};export default board;

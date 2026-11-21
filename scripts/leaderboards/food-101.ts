// Food-101 tests image classification over 101 food categories.
// This importer reads the MTEB Food101Classification task, which reports accuracy on its validation split.
import type {Leaderboard} from './types.ts';
import {taskScores} from './aila-statute-retrieval.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const task='Food101Classification';
const feed='https://mteb-leaderboard-backend.hf.space/v1/tasks/Food101Classification/scores';
const board:Leaderboard={benchmark:'food-101',host:'MTEB',url:'https://leaderboard.mteb.org/tasks/Food101Classification',feed,terms:'MTEB publishes its results under CC0 1.0. https://huggingface.co/datasets/mteb/results',async fetch(){const rows=await taskScores(feed,task,'accuracy',2,100);return checked(rows.map(r=>({...r,setting:'MTEB Food101Classification'})),rows.length);}};export default board;

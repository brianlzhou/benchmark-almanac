// Bash Agent Evals compares agent tool strategies for repository data exploration.
// The project article reports accuracy, token use, cost and duration for three named agents.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://www.braintrust.dev/evals/bash-agent-evals';
const board:Leaderboard={benchmark:'bash-agent-evals-braintrust',url:feed,feed,terms:'Braintrust publishes this experiment page and its linked repository. '+feed,async fetch(){const p=await fetchText(feed);if(!p.includes('SQL')||!p.includes('52.7%')||!p.includes('63.0%'))throw Error('Missing Bash Agent Evals table');return checked([{model:'SQL agent',score:100,metrics:{avgTokens:155531,costUsd:0.51,durationSeconds:45}},{model:'Bash agent',score:52.7,metrics:{avgTokens:1062031,costUsd:3.34,durationSeconds:401}},{model:'Filesystem agent',score:63,metrics:{avgTokens:1275871,costUsd:3.89,durationSeconds:126}}],3);}};export default board;

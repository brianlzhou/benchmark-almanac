// Bash Agent Evals compares agent tool strategies for repository data exploration.
// The project article reports accuracy, token use, cost and duration for three named agents.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://www.braintrust.dev/evals/bash-agent-evals';
const board:Leaderboard={benchmark:'bash-agent-evals-braintrust',url:feed,feed,harnesses:'system',terms:'Braintrust publishes this experiment page and its linked repository. '+feed,stats:{avgTokens:{name:'Average tokens',unit:'tokens'},costUsd:{name:'Cost',unit:'usd',better:'lower'},durationSeconds:{name:'Duration',unit:'seconds',better:'lower'}},async fetch(){
  const p=await fetchText(feed);
  if(!p.includes('SQL')||!p.includes('52.7%')||!p.includes('63.0%'))throw Error('Missing Bash Agent Evals table');
  // The three experiment links below the results table name the model used for each score.
  const model = 'claude-sonnet-4-5';
  for (const experiment of ['sql', 'bash', 'fs']) {
    if (!p.includes('/experiments/' + experiment + '-' + model + '?')) throw Error('Missing Braintrust experiment for ' + experiment);
  }
  return checked([
    { model, harness: 'SQL agent', score: 100, metrics: { avgTokens: 155531, costUsd: 0.51, durationSeconds: 45 } },
    { model, harness: 'Bash agent', score: 52.7, metrics: { avgTokens: 1062031, costUsd: 3.34, durationSeconds: 401 } },
    { model, harness: 'Filesystem agent', score: 63, metrics: { avgTokens: 1275871, costUsd: 3.89, durationSeconds: 126 } },
  ],3);
}};export default board;

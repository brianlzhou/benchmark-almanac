// CodeIPI tests coding agents against indirect prompt injection in issue and repository artifacts.
// The repository README reports composite accuracy for five named model runs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://raw.githubusercontent.com/UKGovernmentBEIS/inspect_evals/c2d3d5e1335c07fb8032bcfc7869e9437e635c4c/src/inspect_evals/ipi_coding_agent/README.md';
const board:Leaderboard={benchmark:'codeipi',url:'https://github.com/UKGovernmentBEIS/inspect_evals/tree/c2d3d5e1335c07fb8032bcfc7869e9437e635c4c/src/inspect_evals/ipi_coding_agent',feed:FEED,terms:'The repository is licensed under Apache 2.0. https://github.com/UKGovernmentBEIS/inspect_evals/blob/main/LICENSE',async fetch(){const t=await fetchText(FEED);if(!t.includes('claude-sonnet-4-6-20250514')||!t.includes('91.1%'))throw new Error('CodeIPI model table missing');return checked([{model:'anthropic/claude-sonnet-4-20250514',score:75.6},{model:'anthropic/claude-sonnet-4-6-20250514',score:91.1},{model:'openai/gpt-4o-2024-11-20',score:62.2},{model:'openai/gpt-4.1-2025-04-14',score:88.9},{model:'openai/gpt-4o-mini',score:40.0}],5)}};export default board;

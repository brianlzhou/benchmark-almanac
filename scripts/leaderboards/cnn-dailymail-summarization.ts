// CNN/DailyMail tests news summarization. HELM Classic lists ROUGE-2 first in its
// summarization_cnndm table. The score is the published bigram overlap score on a 0 to 1 scale.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { HELM_ALIASES, helmFeed, helmRows, type HelmTable } from './helm-capabilities.ts';
const table: HelmTable = {project:'classic',group:'summarization_cnndm',column:'ROUGE-2'};
const board: Leaderboard = {
  benchmark:'cnn-dailymail-summarization', host:'HELM Classic',
  url:'https://crfm.stanford.edu/helm/classic/latest/#/groups/summarization_cnndm',feed:helmFeed(table),
  terms:'Stanford publishes the HELM outputs. The HELM license is at https://github.com/stanford-crfm/helm/blob/main/LICENSE.',
  aliases:{...HELM_ALIASES, 'GPT-J (6B)':'gpt-j-6b','GPT-NeoX (20B)':'gpt-neox-20b','T5 (11B)':'t5-11b','OPT (175B)':'opt-175b','BLOOM (176B)':'bloom-176b'},
  parts:{'BERTScore (F1)':'BERTScore (F1)',SummaC:'SummaC',QAFactEval:'QAFactEval'},
  async fetch() {
    const rows = await helmRows(table,true);
    for (const row of rows) {
      const m = row.metrics!;
      if (!Number.isFinite(m['# output tokens'])) throw new Error('Missing HELM summarization columns');
      m.inputTokens = m['# prompt tokens'];
      m.outputTokens = m['# output tokens'];
      row.trials = Number.isInteger(m['# trials']) ? m['# trials'] : undefined;
    }
    return checked(rows,42);
  },
};
export default board;

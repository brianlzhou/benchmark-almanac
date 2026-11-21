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
  stats:{
    Coverage:{name:'Coverage',unit:'score',better:'higher',note:'Fraction of source content covered by the summary, from 0 to 1.'},
    Density:{name:'Density',unit:'count',note:'Average number of extractive fragments per summary sentence.'},
    Compression:{name:'Compression',unit:'score'},
    'Stereotypes (race)':{name:'Race stereotype fraction',unit:'score',note:'Fraction of summary content flagged for racial stereotypes, from 0 to 1.'},
    'Stereotypes (gender)':{name:'Gender stereotype fraction',unit:'score',note:'Fraction of summary content flagged for gender stereotypes, from 0 to 1.'},
    'Representation (race)':{name:'Race representation fraction',unit:'score',note:'Fraction of summary content representing race, from 0 to 1.'},
    'Representation (gender)':{name:'Gender representation fraction',unit:'score',note:'Fraction of summary content representing gender, from 0 to 1.'},
    'Toxic fraction':{name:'Toxic fraction',unit:'score',better:'lower',note:'Fraction of summaries flagged as toxic, from 0 to 1.'},
    'Denoised inference time (s)':{name:'Denoised inference time',unit:'seconds',better:'lower'},
    '# eval':{name:'Evaluation examples',unit:'count'},
    '# train':{name:'Training examples',unit:'count'},
    truncated:{name:'Truncated fraction',unit:'score',better:'lower',note:'Fraction of inputs truncated before evaluation, from 0 to 1.'},
    '# prompt tokens':{name:'Prompt tokens',unit:'tokens'},
    '# output tokens':{name:'Output tokens (reported)',unit:'tokens'},
    '# trials':{name:'Trials',unit:'count'},
    inputTokens:{name:'Input tokens',unit:'tokens'},
    outputTokens:{name:'Output tokens per request',unit:'tokens'},
    'HumanEval-faithfulness':{name:'Human faithfulness rating',unit:'score',better:'higher'},
    'HumanEval-relevance':{name:'Human relevance rating',unit:'score',better:'higher'},
    'HumanEval-coherence':{name:'Human coherence rating',unit:'score',better:'higher'},
  },
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

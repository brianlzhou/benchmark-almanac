// PeerQA asks models to answer reviewers' questions using a scientific paper.
// Table 12 and the authors' additional results report ROUGE-L against answer evidence first.
// The other reference answers, judges and answerability measurements stay with the same context setting.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const paper = 'https://arxiv.org/html/2502.13668';
const feed = 'https://raw.githubusercontent.com/UKPLab/PeerQA/HEAD/README.md';
const generation = ['rougeEvidence', 'rougeFreeForm', 'rougeGpt4', 'alignEvidence', 'alignFreeForm', 'alignGpt4', 'prometheusFreeForm', 'prometheusGpt4'];
const classification = ['answerablePrecision', 'answerableRecall', 'answerableF1', 'unanswerablePrecision', 'unanswerableRecall', 'unanswerableF1', 'accuracy', 'weightedF1', 'macroF1'];

function parseResults(html: string, minimum: number) {
  const tables = paperTables(html.replace(/(rowspan|colspan)=(\d+)/g, '$1="$2"')).map(grid);
  const answers = tables.find(t => t[0]?.includes('Rouge-L') && t[1]?.includes('GPT-4 FF'));
  const classes = tables.find(t => t[0]?.includes('Average') && t[1]?.some(x => /^(?:Acc\.|Accuracy)$/.test(x)));
  if (!answers || !classes || answers[0][5] !== 'AlignScore' || answers[0][8] !== 'Prometheus') throw new Error('Missing PeerQA tables');
  const byContext = new Map(classes.slice(2).map(r => [r.slice(0, 2).join('|').toLowerCase(), r]));
  return checked(answers.slice(2).map(([model, context, ...values]) => {
    const other = byContext.get([model, context].join('|').toLowerCase());
    const metrics: Record<string, number> = {};
    function read(keys: string[], cells: string[]) {
      if (keys.length !== cells.length) throw new Error('Unexpected number of PeerQA metrics');
      cells.forEach((s, i) => {
        if (/^[-–]+$/.test(s)) return;
        if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('Invalid PeerQA metric: ' + s);
        metrics[keys[i]] = Number(s);
      });
    }
    read(generation, values);
    if (other) read(classification, other.slice(2));
    const setting = /^(G|Gold)$/.test(context) ? 'Gold evidence' : /^(FT|Full-Text)$/.test(context) ? 'Full text' : 'Top ' + context + ' paragraphs';
    return { model, setting, score: metrics.rougeEvidence, metrics };
  }), minimum);
}

export default {
  benchmark: 'peerqa', url: 'https://github.com/UKPLab/PeerQA#additional-results', feed, static: 'paper',
  headline: 'The headline is answer-generation ROUGE-L against the authors’ answer evidence, the first measure in Table 12.',
  terms: 'The authors publish additional results on GitHub and Table 12 on arXiv. https://github.com/UKPLab/PeerQA',
  stats: {
    rougeEvidence: { name: 'ROUGE-L against evidence', unit: 'score', better: 'higher', note: 'ROUGE-L score from 0 to 1 against the authors’ answer evidence.' },
    rougeFreeForm: { name: 'ROUGE-L against free-form reference', unit: 'score', better: 'higher', note: 'ROUGE-L score from 0 to 1 against the free-form reference answer.' },
    rougeGpt4: { name: 'ROUGE-L against GPT-4 reference', unit: 'score', better: 'higher', note: 'ROUGE-L score from 0 to 1 against the GPT-4 reference answer.' },
    alignEvidence: { name: 'AlignScore against evidence', unit: 'score', better: 'higher', note: 'AlignScore from 0 to 1 against the authors’ answer evidence.' },
    alignFreeForm: { name: 'AlignScore against free-form reference', unit: 'score', better: 'higher', note: 'AlignScore from 0 to 1 against the free-form reference answer.' },
    alignGpt4: { name: 'AlignScore against GPT-4 reference', unit: 'score', better: 'higher', note: 'AlignScore from 0 to 1 against the GPT-4 reference answer.' },
    prometheusFreeForm: { name: 'Prometheus score against free-form reference', unit: 'rating', better: 'higher' },
    prometheusGpt4: { name: 'Prometheus score against GPT-4 reference', unit: 'rating', better: 'higher' },
    answerablePrecision: { name: 'Answerable precision', unit: 'score', better: 'higher', note: 'Precision from 0 to 1 for answerable questions.' },
    answerableRecall: { name: 'Answerable recall', unit: 'score', better: 'higher', note: 'Recall from 0 to 1 for answerable questions.' },
    answerableF1: { name: 'Answerable F1', unit: 'score', better: 'higher', note: 'F1 score from 0 to 1 for answerable questions.' },
    unanswerablePrecision: { name: 'Unanswerable precision', unit: 'score', better: 'higher', note: 'Precision from 0 to 1 for unanswerable questions.' },
    unanswerableRecall: { name: 'Unanswerable recall', unit: 'score', better: 'higher', note: 'Recall from 0 to 1 for unanswerable questions.' },
    unanswerableF1: { name: 'Unanswerable F1', unit: 'score', better: 'higher', note: 'F1 score from 0 to 1 for unanswerable questions.' },
    accuracy: { name: 'Answerability accuracy', unit: 'score', better: 'higher', note: 'Accuracy score from 0 to 1 for answerability classification.' },
    weightedF1: { name: 'Weighted F1', unit: 'score', better: 'higher', note: 'Weighted F1 score from 0 to 1.' },
    macroF1: { name: 'Macro F1', unit: 'score', better: 'higher', note: 'Macro-averaged F1 score from 0 to 1.' },
  },
  aliases: {
    'Gemma-3-27b-it-128k': 'gemma-3-27b', 'Llama-3.3-70b-IT-128k': 'llama-3-3-70b-instruct',
    'GPT-4o 0806-128k': 'gpt-4o-aug-2024', 'Mistral v02-7B-32k': 'mistral-7b-instruct-v0-2',
    'GPT-3.5 Turbo-0613-16k': 'gpt-3-5-turbo-jun-2023', 'DeepSeek-R1-Qwen-7B-128k': 'deepseek-r1-distill-qwen-7b',
    'DeepSeek-R1-Qwen-14B-128k': 'deepseek-r1-distill-qwen-14b', 'DeepSeek-R1-Qwen-32B-128k': 'deepseek-r1-distill-qwen-32b',
    'DeepSeek-R1-Llama-70b-128k': 'deepseek-r1-distill-llama-70b', 'Deepseek-R1-Qwen3-8B-128k': 'deepseek-r1-0528-qwen3-8b',
  },
  async fetch() {
    const extra = (await fetchText(feed)).split('## Additional Results')[1];
    if (!extra) throw new Error('Missing additional results section');
    return checked([...parseResults(await paperHtml(paper), 36), ...parseResults(extra, 39)], 75);
  },
} satisfies Leaderboard;

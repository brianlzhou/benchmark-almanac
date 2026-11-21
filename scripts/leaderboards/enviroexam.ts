// EnviroExam ranks models by mean accuracy discounted for variation across 42 courses. The paper's Figures 8 and 9 distinguish the two shot settings that the dataset card duplicates.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://arxiv.org/pdf/2405.11265";

const board: Leaderboard = {
  benchmark: "enviroexam", static: 'paper',
  url: "https://huggingface.co/datasets/enviroscientist/EnviroExam#leaderboard",
  feed: FEED,
  terms: "The dataset card specifies MIT. Its two score tables repeat identical rows. Check against the paper before import. https://huggingface.co/datasets/enviroscientist/EnviroExam Hugging Face allows crawling in robots.txt. Scores are credited to the EnviroExam authors.",
  async fetch() {
    const card = tables(await fetchText(board.url)).find((t) => t[0].at(-1)?.text === 'M*(1-cv)');
    if (!card || card.length !== 32) throw new Error('Expected 31 EnviroExam model labels');
    const models = card.slice(1);
    const paper = (await pdfText(FEED)).split('Details of 5-shot and 0-shot evaluations for 31 LLMs').at(-1)!;
    const figures = paper.split(/Figure 8: Detail scores for each subject in 5-shot/);
    if (figures.length !== 2) throw new Error('Missing EnviroExam appendix figures');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = figures.flatMap((figure, setting) => {
      const block = figure.slice(figure.indexOf('environmental_science'), figure.indexOf('M*(1-cv)') + figure.slice(figure.indexOf('M*(1-cv)')).indexOf('\n'));
      const metrics = models.map(() => ({} as Record<string, number>));
      for (const line of block.trim().split(/\r?\n/)) {
        const [label, ...values] = line.trim().replace(/^\d+\s+(?=[a-z_])/, '').split(/\s+/);
        if (!label) continue;
        if (values.length !== models.length || !values.every((s) => Number.isFinite(Number(s)))) throw new Error(`Invalid EnviroExam row: ${label}`);
        values.forEach((value, i) => { metrics[i][label === 'σ' ? 'std' : label] = Number(value); });
        if (!['mean', 'σ', 'cv', '1-cv', 'M*(1-cv)'].includes(label.toLowerCase())) parts[label] = { name: label.replaceAll('_', ' '), unit: '%' };
      }
      return models.map((r, i) => {
        const score = metrics[i]['M*(1-cv)'];
        if (!Number.isFinite(score) || (setting === 1 && Number(r.at(-1)!.text) !== score)) throw new Error('Paper and dataset card disagree on zero-shot column order');
        return { model: r[0].text, setting: setting === 0 ? 'Five-shot' : 'Zero-shot', score, metrics: metrics[i] };
      });
    });
    if (Object.keys(parts).length < 42) throw new Error('Incomplete course scores');
    board.parts = parts;
    return rows;
  },
};
export default board;

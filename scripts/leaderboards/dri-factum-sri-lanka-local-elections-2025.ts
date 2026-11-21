// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// DRI and Factum assess the accuracy of electoral answers and the neutrality of political answers.
// Two charts in the report publish percentages for each chatbot across three languages.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://democracyreporting.s3.eu-central-1.amazonaws.com/images/68307c4a39e67.pdf';
function chart(paper: string, title: string) {
  const section = paper.split(title)[1]?.split(/\n0%/)[0];
  if (!section) throw new Error('Missing chart: ' + title);
  return new Map([...section.matchAll(/^ ([^:\n]+):\s*\n\s*([\d.]+%[^\n]*)/gm)].map(m =>
    [m[1].trim(), [...m[2].matchAll(/([\d.]+)%/g)].map(n => Number(n[1]))]));
}
const board: Leaderboard = {
  benchmark: 'dri-factum-sri-lanka-local-elections-2025', static: 'paper', feed, url: feed,
  terms: 'Democracy Reporting International and Factum publish the election audit. ' + feed,
  stats: {
    biased: { name: 'Biased political answers', unit: '%' },
    falseOrMisleading: { name: 'False or misleading answers', unit: '%' },
    noInformation: { name: 'No information answers', unit: '%' },
    partiallyCorrect: { name: 'Partially correct answers', unit: '%' },
  },
  headline: 'The report gives no overall score, so this is the plain mean of procedural accuracy and political neutrality.',
  parts: {correct: 'Correct electoral answers', unbiased: 'Unbiased political answers'},
  async fetch() {
    const paper = await pdfText(feed);
    const accuracy = chart(paper, 'Accuracy of electoral answers by model');
    const neutrality = chart(paper, 'Percentage of biased political answers by model');
    const rows = [...accuracy].map(([model, values]) => {
      const political = neutrality.get(model);
      if (![3, 4].includes(values.length) || !political || ![1,2].includes(political.length)) throw new Error('Missing chart categories for ' + model);
      const correct = values.at(-1)!;
      const unbiased = political.at(-1)!;
      return {model, score: (correct + unbiased)/2, metrics: {correct, unbiased, falseOrMisleading: values.at(-3)!, partiallyCorrect: values.at(-2)!,
        noInformation: values.length === 4 ? values[0] : 0, biased: political.length === 2 ? political[0] : 0}};
    });
    return checked(rows, 4);
  },
};
export default board;

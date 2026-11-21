// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Arize tests hallucination judgments, evaluator decisions and routing. Routing accuracy is correct choices divided by cases.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arize.com/blog/decision-model-benchmark/';
const board: Leaderboard = {
  benchmark: 'decision-model-benchmark-arize', url: feed, feed,
  terms: 'Arize AI publishes the comparison on its website. https://arize.com/blog/decision-model-benchmark/',
  aliases: { 'OpenAI Decisions': 'gpt-6-luna' },
  parts: { hallucination: 'Hallucination (RAGTruth)', evaluators: 'Evaluators (Phoenix suites)', routing: 'Routing' },
  stats:{routingCorrect:{name:'Correct routing choices',unit:'count'},routingCases:{name:'Routing cases',unit:'count'},calibrationError:{name:'Calibration error',unit:'score',better:'lower'},ragLatencyP50Seconds:{name:'RAG latency p50',unit:'seconds',better:'lower'},ragCostPerThousandUsd:{name:'RAG cost per 1,000',unit:'usd',better:'lower'}},
  async fetch() {
    const header = 'Model|Hallucination (RAGTruth)|Evaluators (Phoenix suites)|Routing|Calibration error|Latency (p50, RAGTruth)|Cost per 1,000 (RAGTruth)';
    const table = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === header);
    if (!table) throw new Error('Missing Arize comparison table');
    return checked(table.slice(1).map(row => {
      const [model, rag, suite, ratio, calibration, latency, cost] = row.map(c => c.text);
      const routingCounts = ratio?.match(/^(\d+)\/([1-9]\d*)$/);
      if (!routingCounts || ![rag, suite].every(v => /^\d+(\.\d+)?%$/.test(v)) || !/^[\d.]+$/.test(calibration)
        || !/^[\d.]+ s$/.test(latency) || !/^\$[\d.]+(?: \(local\))?$/.test(cost)) throw new Error('Invalid comparison for ' + model);
      const hallucination = parseFloat(rag);
      const evaluators = parseFloat(suite);
      const routing = 100 * Number(routingCounts[1]) / Number(routingCounts[2]);
      return { model, score: (hallucination + evaluators + routing) / 3, metrics: { hallucination, evaluators, routing,
        routingCorrect: Number(routingCounts[1]), routingCases: Number(routingCounts[2]), calibrationError: Number(calibration),
        ragLatencyP50Seconds: parseFloat(latency), ragCostPerThousandUsd: parseFloat(cost.slice(1)) } };
    }), 8);
  },
};
export default board;

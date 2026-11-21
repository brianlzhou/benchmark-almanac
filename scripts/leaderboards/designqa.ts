// DesignQA tests engineering document understanding. The authors' evaluator averages six segment scores equally. The project site supplies those rounded segment scores in JSON.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://design-qa.github.io/public/data.json";

const segments = { retrievalF1BoW: 'Retrieval', compilationF1Rules: 'Compilation', definitionF1BoC: 'Definition',
  presenceACC: 'Presence', dimensionACC: 'Dimension', functionalPerformanceACC: 'Functional Performance' };

const board: Leaderboard = {
  benchmark: "designqa",
  url: "https://design-qa.github.io/#leaderboardStart",
  feed: FEED,
  terms: "The results page gives no score reuse license. https://design-qa.github.io/ The site returns a 404 page for robots.txt.",
  parts: segments,
  async fetch() {
    const data = await fetchJson<Record<string, Record<string, string>[]>>(FEED);
    const scores = new Map<string, Record<string, number>>();
    for (const section of ['extraction', 'comprehension', 'compliance']) {
      for (const { modelName, ...values } of data[section]) {
        if (!modelName) throw new Error('Missing DesignQA configuration');
        const metrics = scores.get(modelName) ?? {};
        for (const [key, token] of Object.entries(values)) {
          if (token === 'N/A') continue;
          const value = Number(token === '0 (Failure)' ? 0 : token);
          if (!token.trim() || !Number.isFinite(value)) throw new Error(`Invalid ${key} for ${modelName}`);
          metrics[key] = value;
        }
        scores.set(modelName, metrics);
      }
    }
    if (scores.size < 8) throw new Error('Expected eight DesignQA configurations');
    return [...scores].map(([name, metrics]) => {
      const components = Object.keys(segments).map((key) => metrics[key]);
      if (!components.every(Number.isFinite)) throw new Error(`Incomplete DesignQA configuration ${name}`);
      const match = name.match(/^(.*)-(AllRules|RAG)$/);
      return { model: match?.[1] ?? name, setting: match?.[2], metrics, score: components.reduce((a, b) => a + b) / 6 };
    });
  },
};
export default board;

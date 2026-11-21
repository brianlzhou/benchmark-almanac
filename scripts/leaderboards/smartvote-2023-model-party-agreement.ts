// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Each part measures a model's agreement with one Swiss party on the 2023 Smartvote questionnaire.
// The authors' results JSON includes confidence intervals for each party separately.
import type { BoardPart, Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/joelbarmettlerUZH/swiss-llm-bias-analysis/HEAD/results/paper/smartvote_agreement_scores.json';
const parties = { sp: {name: 'SP', unit: '%', better: 'higher'}, greens: {name: 'Grüne', unit: '%', better: 'higher'}, glp: {name: 'GLP', unit: '%', better: 'higher'}, centre: {name: 'Die Mitte', unit: '%', better: 'higher'}, fdp: {name: 'FDP', unit: '%', better: 'higher'}, svp: {name: 'SVP', unit: '%', better: 'higher'} } as const satisfies Record<string, BoardPart>;
type Agreement = { agreement: number; ci_lower: number; ci_upper: number; n_politicians: number };
const board: Leaderboard = {
  benchmark: 'smartvote-2023-model-party-agreement', url: 'https://github.com/joelbarmettlerUZH/swiss-llm-bias-analysis', feed, parts: parties,
  stats: {
    spPoliticians: {name: 'SP politicians', unit: 'count'}, greensPoliticians: {name: 'Grüne politicians', unit: 'count'},
    glpPoliticians: {name: 'GLP politicians', unit: 'count'}, centrePoliticians: {name: 'Die Mitte politicians', unit: 'count'},
    fdpPoliticians: {name: 'FDP politicians', unit: 'count'}, svpPoliticians: {name: 'SVP politicians', unit: 'count'},
  },
  aliases: {
    "Mistral 7B v0.1": "mistral-7b-instruct-v0-1",
    "Claude 3 Haiku": "claude-3-haiku",
    "Command R+": "command-r-plus",
    "Yi Large": "yi-large",
    "GPT-4o Mini": "gpt-4o-mini",
    "Mistral Nemo": "mistral-nemo",
    "Jamba": "jamba-1-5-large",
    "o1": "o1",
    "Phi-4": "phi-4",
    "DeepSeek R1": "deepseek-r1",
    "o3-mini": "o3-mini",
    "Llama 4 Maverick": "llama-4-maverick",
    "o4-mini": "o4-mini",
    "Mistral Medium 3": "mistral-medium-3",
    "Claude Opus 4": "claude-opus-4",
    "Claude Sonnet 4": "claude-sonnet-4",
    "Grok 3": "grok-3",
    "Grok 3 Mini": "grok-3-mini",
    "Grok 4": "grok-4",
    "GPT-5": "gpt-5",
    "Hermes 4 405B": "hermes-4-405b",
    "Grok 4 Fast": "grok-4-fast",
    "Kimi K2.5": "kimi-k2-5",
    "GLM-5": "glm-5",
    "Qwen 3.5 397B": "qwen3-5-397b-a17b",
    "MiMo v2 Pro": "mimo-v2-pro"
},
  terms: 'Smartvote and Politools provided the questionnaire and candidate responses. Source terms: https://github.com/joelbarmettlerUZH/swiss-llm-bias-analysis/blob/main/DATA_LICENSE',
  headline: 'The source gives no overall score. This is mean agreement with six parties, with equal weight for each party.',
  async fetch() {
    const data = await fetchJson<{ results: { models: Record<string,{ display: string; agreements: Record<string,Agreement> }> } }>(feed);
    const rows = Object.values(data.results.models).flatMap(r => {
      const metrics: Record<string, number> = {};
      let total = 0;
      for (const [key, part] of Object.entries(parties)) {
        const result = r.agreements[part.name];
        if (!result) return [];
        if (![result.agreement, result.ci_lower, result.ci_upper, result.n_politicians].every(Number.isFinite)) throw new Error('Invalid agreement for ' + part.name);
        metrics[key] = result.agreement;
        metrics[key + 'Low'] = result.ci_lower;
        metrics[key + 'High'] = result.ci_upper;
        metrics[key + 'Politicians'] = result.n_politicians;
        total += result.agreement;
      }
      return [{ model: r.display, score: total / 6, metrics }];
    });
    return checked(rows, 66);
  },
};
export default board;

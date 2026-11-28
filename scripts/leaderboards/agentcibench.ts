// AgentCIBench (UKPLab, TU Darmstadt, EMNLP 2026): contextual integrity privacy leakage by computer-use agents
// across 117 BrowserGym OpenApps scenarios. The site loads window.AGENTS from static data.js and ranks models
// ascending by engagement-conditioned leakage L_eng = L / (1 - R) (lower is better). The 95% bootstrap interval
// `ci` in data.js applies to raw leakage `leak` rather than headline `eng`, so row.low and row.high are omitted.
// analysis.html draws the "Utility vs disclosure restraint" Pareto scatter plotting utility against engaged leakage.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const SITE = 'https://ukplab.github.io/emnlp2026-agentcibench/';
const FEED = `${SITE}data.js`;

interface AgentRow {
  model: string;
  family: string;
  group: string;
  util: number;
  leak: number;
  refusal: number;
  eng: number;
  ci?: [number, number];
  post?: boolean;
}

const board: Leaderboard = {
  benchmark: 'agentcibench',
  url: SITE,
  feed: FEED,
  terms: 'UKPLab publishes the benchmark site and static data.js on GitHub Pages with no robots.txt restrictions, alongside a public dataset on Hugging Face.',
  stats: {
    utility: { name: 'Utility', unit: '%', better: 'higher', note: 'Share of tasks where the agent included all required information.' },
    rawLeakage: { name: 'Raw leakage', unit: '%', better: 'lower', note: 'Unconditioned share of scenarios where private context was disclosed to the wrong recipient.' },
    refusal: { name: 'Refusal rate', unit: '%', note: 'Share of scenarios where the agent refused to complete the request.' },
  },
  chart: {
    title: 'Utility vs disclosure restraint',
    x: { key: 'utility', label: 'Utility', unit: '%', better: 'higher' },
    y: { key: 'score', label: 'Engaged leakage', unit: '%', better: 'lower' },
    note: 'Engaged leakage plotted against task utility across all evaluated agents, redrawn from the site analysis page.',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const marker = 'window.AGENTS';
    const at = js.indexOf(marker);
    if (at < 0) throw new Error('AgentCIBench data.js missing window.AGENTS');
    const start = js.indexOf('[', at);
    if (start < 0) throw new Error('AgentCIBench data.js missing AGENTS array');
    const agents = jsLiteral<AgentRow[]>(js, start);
    if (!Array.isArray(agents) || agents.length < 15) {
      throw new Error(`AgentCIBench data.js changed: only ${agents?.length ?? 0} rows`);
    }
    const out: LeaderboardRow[] = agents.map((a) => {
      if (!a.model || ![a.eng, a.util, a.leak, a.refusal].every(Number.isFinite)) {
        throw new Error(`AgentCIBench row malformed: ${a.model}`);
      }
      return {
        model: a.model,
        score: a.eng,
        open: a.group === 'open',
        metrics: {
          utility: a.util,
          rawLeakage: a.leak,
          refusal: a.refusal,
        },
      };
    });
    return out;
  },
};

export default board;

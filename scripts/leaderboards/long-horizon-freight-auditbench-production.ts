// Loop reports weighted accuracy on 200 production freight invoices. The article's production results table
// and two relative cost tables are published as images. Their hashes guard the transcription.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checkChart } from '../lib/boards/transcribed-github-chart.ts';

const feed = "https://cdn.prod.website-files.com/668c00971d3dfeff704769f4/6a9651da5d1b1243bed29641_Screenshot%202026-08-31%20at%2011.08.42%E2%80%AFPM.avif";
const figures = [
  { url: 'https://cdn.prod.website-files.com/668c00971d3dfeff704769f4/6a9651da5d1b1243bed29641_Screenshot%202026-08-31%20at%2011.08.42%E2%80%AFPM.avif', hash: 'afcbac810b8a33e54e9163b90bbe63cec016e324046d38ba00a7ff2c871b3583' },
  { url: 'https://cdn.prod.website-files.com/668c00971d3dfeff704769f4/6a96523d76626c5cd231a7e8_Screenshot%202026-08-31%20at%2011.14.45%E2%80%AFPM.avif', hash: '882b11a6335ae0a20b08aa896858771d5885dbcf960a72e1b4910c4c9d25c835' },
  { url: 'https://cdn.prod.website-files.com/668c00971d3dfeff704769f4/6a96524c1c327030ceae8375_Screenshot%202026-08-31%20at%2011.14.49%E2%80%AFPM.avif', hash: 'cd2d48c7ad21e810dfc7a112e31a693fa92484314de89215b8c9c38d00796396' },
];

const board: Leaderboard = {
  benchmark: "long-horizon-freight-auditbench-production",
  url: "https://www.loop.com/article/introducing-the-long-horizon-auditbench-for-supply-chain-ai",
  feed,
  terms: "Loop reserves all rights. Its article reports relative inference costs. The host returned no readable robots.txt rules.",
  async fetch() {
    const page = await fetchText(board.url);
    for (const figure of figures) {
      if (!page.includes(figure.url)) throw new Error('Loop replaced its production results');
      await checkChart(figure.url, figure.hash);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return [
      {"model": "Loop", "score": 94.8, "metrics": {"relativeCostPerAudit": 1, "relativeCostPerCorrectAudit": 1}},
      {"model": "Claude Opus 5", "score": 16.1, "metrics": {"relativeCostPerAudit": 18, "relativeCostPerCorrectAudit": 105}},
      {"model": "GLM 5.3 Flash", "score": 11.4, "metrics": {"relativeCostPerAudit": 0.38, "relativeCostPerCorrectAudit": 3.3}},
      {"model": "Kimi K3", "score": 10.3, "metrics": {"relativeCostPerAudit": 8.3, "relativeCostPerCorrectAudit": 76}},
      {"model": "GPT-5.6 Luna", "score": 7.4, "metrics": {"relativeCostPerAudit": 1.01, "relativeCostPerCorrectAudit": 13}},
      {"model": "Grok 4.6", "score": 1.6, "metrics": {"relativeCostPerAudit": 25, "relativeCostPerCorrectAudit": 1493}},
    ];
  },
};
export default board;

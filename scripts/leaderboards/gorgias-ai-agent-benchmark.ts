// Gorgias ranks ecommerce agents on shopping and support conversations. Its scoreboard embeds both job scores and their published overall rating.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://evals.gorgias.com/";
interface Overall { v: string; ov: number; cs: number | null; cp: number | null }
interface Lane { v: string; q: number; a: number; l: number; t: number; c: number; st: number }

const board: Leaderboard = {
  benchmark: "gorgias-ai-agent-benchmark",
  url: "https://evals.gorgias.com/report",
  feed: FEED,
  terms: "Gorgias publishes aggregate rankings and restricts access to transcripts. The repository provides no license for score reuse. https://github.com/gorgias/ai-agent-benchmark The public scoreboard is allowed in robots.txt.",
  parts: { shopping: 'Shopping', support: 'Support' },
  stats: {
    shopping_quality: { name: 'Shopping quality', unit: '%', better: 'higher' },
    shopping_automation: { name: 'Shopping automation rate', unit: '%', better: 'higher' },
    shopping_latency: { name: 'Shopping full answer', unit: 'seconds', better: 'lower' },
    shopping_ttft: { name: 'Shopping first signal', unit: 'seconds', better: 'lower' },
    shopping_conversations: { name: 'Shopping conversations', unit: 'count' },
    shopping_stores: { name: 'Shopping stores', unit: 'count' },
    support_quality: { name: 'Support quality', unit: '%', better: 'higher' },
    support_automation: { name: 'Support automation rate', unit: '%', better: 'higher' },
    support_latency: { name: 'Support full answer', unit: 'seconds', better: 'lower' },
    support_ttft: { name: 'Support first signal', unit: 'seconds', better: 'lower' },
    support_conversations: { name: 'Support conversations', unit: 'count' },
    support_stores: { name: 'Support stores', unit: 'count' },
  },
  chart: {
    title: 'Shopping answer quality vs. automation rate',
    x: { key: 'shopping_automation', label: 'Shopping automation rate', unit: '%', better: 'higher' },
    y: { key: 'shopping_quality', label: 'Shopping quality', unit: '%', better: 'higher' },
    note: 'Gorgias plots answer quality against automation rate for shopping conversations.',
  },
  async fetch() {
    const data = jsonAfter<{ overall: Overall[]; shopping: Lane[]; support: Lane[] }>(await fetchText(FEED), 'var FJB=');
    if (data.overall.length < 13) throw new Error('Missing vendor rankings');
    return data.overall.map(({ v, ov, cs, cp }) => {
      if (!v || !Number.isFinite(ov)) throw new Error('Missing overall score');
      const metrics: Record<string, number> = {};
      for (const [job, score] of [['shopping', cs], ['support', cp]] as const) {
        const lane = data[job].find(r => r.v === v);
        if (score == null) continue;
        if (!Number.isFinite(score) || !lane) throw new Error('Missing job details for ' + v);
        metrics[job] = score;
        for (const [key, value] of Object.entries({ quality: lane.q, automation: lane.a, latency: lane.l, ttft: lane.t, conversations: lane.c, stores: lane.st })) {
          if (Number.isFinite(value)) metrics[job + '_' + key] = value;
        }
      }
      return { model: v, score: ov, metrics };
    });
  },
};
export default board;

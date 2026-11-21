// MERA 1.0 evaluates Russian-language models. Its original text leaderboard embeds submissions
// with the displayed overall score, evaluation configuration and detailed task metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://mera.a-ai.ru/en/text/leaderboard/1.0";
const board: Leaderboard = {
  benchmark: 'mera',
  url: "https://mera.a-ai.ru/en/text/leaderboard/1.0",
  feed,
  terms: "MERA's robots.txt permits access. The public results page does not specify a separate score license.",
  async fetch() {
    const html = await fetchText(feed);
    const tasks = JSON.parse(html.match(/const tasks = (\[.*\]);/)?.[1] ?? 'null') as {title: string}[];
    const submissions = JSON.parse(html.match(/const submits = (\[.*\]);/)?.[1] ?? 'null') as {
      name: string; team_name: string; size: string; score: number; link: string; is_human: boolean;
      measurement_method: string; measurement_type: string[]; used_multi_turn: boolean;
      used_system_prompt: boolean; used_chat_template: boolean; data: Record<string, Record<string, number> | number>;
    }[];
    if (!tasks?.length || submissions?.length < 633 || !submissions) throw new Error('Incomplete MERA submissions');
    const titles = new Map(tasks.map(t => [t.title.toLowerCase(), t.title]));
    board.parts = {};
    return submissions.filter(r => !r.is_human).map(r => {
      if (!r.name || !r.link || !Number.isFinite(r.score) || !r.data) throw new Error('Invalid MERA submission');
      const metrics: Record<string, number> = {};
      for (const [task, values] of Object.entries(r.data)) {
        if (!titles.has(task) || typeof values !== 'object') continue;
        for (const [metric, value] of Object.entries(values)) {
          if (!Number.isFinite(value)) throw new Error('Invalid MERA task metric');
          const key = task + '.' + metric;
          metrics[key] = value;
          board.parts![key] = { name: titles.get(task) + ' ' + metric, group: titles.get(task) };
        }
      }
      const setting = [r.measurement_method, r.used_multi_turn && 'multi-turn', r.used_chat_template && 'chat template',
        r.used_system_prompt && 'system prompt'].filter(Boolean).join(', ');
      return { model: r.name, score: r.score, metrics, link: r.link, submitter: r.team_name, setting,
        open: r.measurement_type.includes('opened'), params: Number(r.size) > 0 ? Number(r.size) / 1e9 : undefined };
    });
  },
};
export default board;

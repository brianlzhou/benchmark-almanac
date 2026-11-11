// C3-Bench's maintained repository is WildToolBench. Its project page publishes the complete
// 57-configuration table as a JavaScript literal. Session accuracy is the whole-dialogue score;
// task accuracy and task-type diagnostics stay in metrics. Never execute the downloaded script.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const PAGE = 'https://yupeijei1997.github.io/WildToolBench/';
const board: Leaderboard = {
  benchmark: 'c3-bench', url: PAGE, feed: `${PAGE} (LB_MAIN_FULL)`,
  terms: 'The official WildToolBench project page publishes these results. Benchmark Almanac credits the authors and links the source.',
  aliases: {"Claude-4-Sonnet": "claude-sonnet-4", "Claude-4.1-Opus": "claude-opus-4-1", "Qwen2.5-0.5B-Instruct": "qwen2-5-0-5b", "Qwen2.5-1.5B-Instruct": "qwen2-5-1-5b", "Qwen2.5-3B-Instruct": "qwen2-5-3b", "Qwen2.5-7B-Instruct": "qwen2-5-7b", "Qwen2.5-14B-Instruct": "qwen2-5-14b", "Qwen2.5-32B-Instruct": "qwen2-5-32b", "Qwen2.5-72B-Instruct": "qwen2-5-72b", "xLAM-2-1B": "xlam-2-1b-fc-r", "xLAM-2-3B": "xlam-2-3b-fc-r", "xLAM-2-8B": "xlam-2-8b-fc-r", "xLAM-2-32B": "xlam-2-32b-fc-r", "xLAM-2-70B": "xlam-2-70b-fc-r"},
  async fetch(): Promise<LeaderboardRow[]> {
    const page = await fetchText(PAGE);
    const marker = 'const LB_MAIN_FULL=';
    const at = page.indexOf(marker);
    if (at < 0) throw new Error('WildToolBench full results table missing');
    const data = jsLiteral<Record<string, string | number>[]>(page, page.indexOf('[', at + marker.length));
    return data.map(r => {
      if (typeof r.m !== 'string' || typeof r.session !== 'number') throw new Error('Invalid WildToolBench result');
      const thinking = /^Qwen3-.+-Thinking$/.test(r.m);
      let model = thinking ? r.m.replace(/-Thinking$/, '') : r.m;
      if (/^(GPT-4o|Gemini-2\.[05]-(Pro|Thinking)|DeepSeek-(R1|V3)|Mistral-Large|Kimi-K2|Doubao-1\.[56](?:-Thinking)?)$/i.test(model)) model += ' (snapshot unspecified)';
      return { model, score: r.session, setting: thinking ? 'thinking' : /^Qwen3-/.test(model) ? 'non-thinking' : undefined,
        metrics: Object.fromEntries(Object.entries(r).filter(([k,v]) => k !== 'session' && typeof v === 'number')) as Record<string, number> };
    });
  },
};
export default board;

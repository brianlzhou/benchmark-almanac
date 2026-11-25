// VideoFDB: the page opens on Perception, whose published Overall is the score.
// The current board tags AV2A and AV2AV entries and no longer lists audio-only baselines. Generation scores belong
// in metrics, not separate headline rows; timing milliseconds become seconds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://research.nvidia.com/labs/amri/projects/video-fdb/leaderboard.html";
const board: Leaderboard = {
 stats: { timingRate: { name: 'Timing rate', unit: '%', better: 'higher' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, generation: { name: 'Avatar generation overall score', unit: 'score', better: 'higher' } },
  benchmark: "videofdb-nvidia", parts: {
  Fluency: { name: 'Fluency', group: 'Dimension' },
  'Conv. Flow': { name: 'Conversational flow', group: 'Dimension' },
  'Vis. Ground.': { name: 'Semantic grounding', group: 'Dimension', note: 'The paper names the visual cue grounding rubric Semantic grounding.' },
}, url: "https://research.nvidia.com/labs/amri/projects/video-fdb/leaderboard.html", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, ""));
    const rows: LeaderboardRow[] = [];
    for (const [i, t] of all.entries()) {
      const head = t[0]?.map(c => c.text.replace(/[↑↓↕▼▲]/g, '').trim()) ?? [];
      const scoreAt = head.indexOf('Overall');
      if (scoreAt < 0) continue;
      const modelAt = head.indexOf('Model') >= 0 ? head.indexOf('Model') : 0;
      let group = '';
      for (const r of t.slice(1)) {
        if (r.length === 1) { group = r[0].text; continue; }
        const score = num(r[scoreAt]?.text);
        const cell = r[modelAt];
        const model = text(cell?.html.match(/class="lb-model-name">([\s\S]*?)<\/span>/)?.[1] ?? cell?.html ?? '');
        if (score === undefined || !model || /^Human/i.test(model)) continue;
        const metrics: Record<string, number> = {};
        for (let j = modelAt + 1; j < scoreAt; j++) {
          const value = num(r[j]?.text);
          if (value !== undefined) metrics[head[j]] = value;
        }
        const timing = r[scoreAt + 1]?.text.replace(/−/g, '-').match(/([\d.]+)%\s*\/\s*(-?[\d.]+)\s*ms/);
        if (timing) Object.assign(metrics, { timingRate: Number(timing[1]), latency: Number(timing[2]) / 1000 });
        const audioOnly = /\bA2A(?:V)?\b/.test(cell.text) || /Audio-only/.test(group);
        rows.push({ model, score, setting: `${i === 0 ? "Conversation" : "Avatar"}; ${audioOnly ? 'Audio-only' : 'Audio+video'}`, metrics });
      }
    }
    if (!rows.length) throw new Error("No videofdb-nvidia score rows");
    return rows.filter(r=>r.setting?.startsWith('Conversation;')).map(r=>{
      const generation=rows.find(x=>x.model===r.model&&x.setting?.startsWith('Avatar;'));
      return {...r,setting:r.setting!.includes('Audio-only')?'audio-only':'audio+video',
        metrics:{...r.metrics,...(generation?{generation:generation.score}:{})}};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;


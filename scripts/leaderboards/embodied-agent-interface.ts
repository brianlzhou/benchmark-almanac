// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The official board ranks embodied decision-making models separately on BEHAVIOR and VirtualHome.
// Read the two published overall performance scores and each environment's seven module metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://embodied-agent-interface.github.io/';
const tracks = ['behavior','virtualhome'] as const;
const labels = { overall_performance:'Overall Performance', goal_interpretation_f1:'Goal Interpretation F1',
  action_sequencing_task_sr:'Action Sequencing Task SR', action_sequencing_execution_sr:'Action Sequencing Execution SR',
  subgoal_decomposition_task_sr:'Subgoal Decomposition Task SR', subgoal_decomposition_execution_sr:'Subgoal Decomposition Execution SR',
  transition_modeling_f1:'Transition Modeling F1', transition_modeling_planner_sr:'Transition Modeling Planner SR' };
const source = (track:string) => url + 'website/data/' + track + '_total_benchmark.json';
const board: Leaderboard = {
  benchmark:'embodied-agent-interface', url, feed:source('behavior'),
  terms:'The makers release the implementation under MIT. https://github.com/embodied-agent-interface/embodied-agent-interface/blob/main/LICENSE',
  headline:'The leaderboard gives a separate overall score for each environment, so the headline averages BEHAVIOR and VirtualHome equally.',
  parts:Object.fromEntries(tracks.flatMap(t => Object.entries(labels).map(([k,name]) => [t + '_' + k,
    {name, group:t === 'behavior' ? 'BEHAVIOR' : 'VirtualHome'}]))),
  aliases:{ 'Claude-3.5 Sonnet (snapshot unspecified)':'claude-3-5-sonnet', 'Cohere Command R':'command-r-03-2024',
    'Gemini 1.5 Flash (snapshot unspecified)':'gemini-1-5-flash-may-2024','GPT-3.5-turbo (snapshot unspecified)':'gpt-3-5-turbo-jan-2024',
    'GPT-4-turbo (snapshot unspecified)':'gpt-4-turbo-apr-2024','GPT-4o (snapshot unspecified)':'gpt-4o-may-2024' },
  async fetch() {
    const results = new Map<string, LeaderboardRow>();
    for (const track of tracks) {
      if (track === 'virtualhome') await new Promise(resolve => setTimeout(resolve,1100));
      const data = await fetchJson<Record<string,unknown>[]>(source(track));
      for (const item of data) {
        if (typeof item.model !== 'string') throw Error('Missing model in ' + track);
        const row = results.get(item.model) ?? { model:item.model, score:0, metrics:{}, open:item.access === 'Open-Weight' };
        for (const k of Object.keys(labels)) {
          const v = item[k];
          if (typeof v !== 'number' || !Number.isFinite(v)) throw Error('Invalid ' + k + ' for ' + item.model);
          if (track + '_' + k in row.metrics!) throw Error('Duplicate environment result');
          row.metrics![track + '_' + k] = v;
        }
        results.set(item.model,row);
      }
    }
    const rows = Array.from(results.values()).filter(r => Object.keys(r.metrics!).length === 2 * Object.keys(labels).length);
    for (const row of rows) row.score = (row.metrics!.behavior_overall_performance + row.metrics!.virtualhome_overall_performance) / 2;
    return checked(rows,18);
  },
};
export default board;

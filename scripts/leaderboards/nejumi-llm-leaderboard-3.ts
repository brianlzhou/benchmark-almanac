// Nejumi Leaderboard 3 ranks Japanese language models by TOTAL_AVG. Its W&B report selects runs tagged leaderboard and combines their leaderboard_table files.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';

const FEED = "https://api.wandb.ai/graphql";
interface Run { name: string; displayName: string; createdAt: string; summaryMetrics: string }
interface Page { data: { project: { runs: { edges: {node: Run}[]; pageInfo: {hasNextPage: boolean; endCursor: string} } } } }
interface Table { columns: string[]; data: (string | number | null)[][] }
const project = 'wandb-japan/llm-leaderboard3';
const query = `query ($after: String, $filters: JSONString!) {
  project(entityName:"wandb-japan",name:"llm-leaderboard3") {
    runs(first:100,after:$after,filters:$filters) { edges { node { name displayName createdAt summaryMetrics } } pageInfo { hasNextPage endCursor } }
  }
}`;
const pause = () => new Promise(resolve => setTimeout(resolve, 1000));

const board: Leaderboard = {
  benchmark: "nejumi-llm-leaderboard-3",
  url: "https://wandb.ai/wandb-japan/llm-leaderboard3/reports/Nejumi-LLM-3--Vmlldzo3OTg2NjM2",
  feed: FEED,
  terms: "The tagged repository identifies this public report and does not specify separate terms for its scores. https://github.com/wandb/llm-leaderboard/tree/v3.0.0",
  aliases: {"mistralai/mistral-small-3.1-24b-instruct":"mistral-small-3-1","command-a-03-2025":"cohere-command-a","qwen-max-2025-01-25":"qwen2-5-max","deepseek-reasoner":"deepseek-r1","gemini-1.5-flash-8b-001":"gemini-1-5-flash-8b","us.amazon.nova-micro-v1:0":"amazon-nova-micro","us.amazon.nova-pro-v1:0":"amazon-nova-pro","us.amazon.nova-lite-v1:0":"amazon-nova-lite","mistralai/Mistral-Large-Instruct-2411":"mistral-large-2-nov-2024","anthropic.claude-3-5-sonnet-20241022-v2:0":"claude-3-5-sonnet-october-2024","anthropic.claude-3-opus-20240229-v1:0":"claude-3-opus","anthropic.claude-3-sonnet-20240229-v1:0":"claude-3-sonnet","anthropic.claude-3-haiku-20240307-v1:0":"claude-3-haiku","anthropic.claude-3-5-sonnet-20240620-v1:0":"claude-3-5-sonnet","mistral-large-2407":"mistral-large-2-jul-2024","open-mistral-nemo":"mistral-nemo"},
  async fetch() {
    const rows = [];
    board.parts = {};
    let after: string | null = null;
    do {
      const page: Page = await fetchJson(FEED, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { after, filters: JSON.stringify({ tags: { $in: ['leaderboard'] } }) } }) });
      const { edges, pageInfo } = page.data.project.runs;
      for (const { node } of edges) {
        const path = JSON.parse(node.summaryMetrics).leaderboard_table?.path;
        if (!path?.startsWith('media/table/leaderboard_table_')) throw new Error('Missing leaderboard table for ' + node.name);
        await pause();
        const source = await fetchText('https://api.wandb.ai/files/' + project + '/' + node.name + '/' + path);
        // Some historical tables encode a missing model size as the Python literal NaN.
        const table = JSON.parse(source.replace(/([,\[]\s*)NaN(?=\s*[,\]])/g, '$1null')) as Table;
        if (!table.columns.includes('TOTAL_AVG') || !table.columns.includes('model_name') || !table.data.length)
          throw new Error('Missing Nejumi result columns');
        for (const cells of table.data) {
          const row = Object.fromEntries(table.columns.map((k, i) => [k, cells[i]]));
          if (typeof row.TOTAL_AVG !== 'number' || typeof row.model_name !== 'string') throw new Error('Invalid Nejumi result');
          const metrics: Record<string, number> = {};
          for (const [k, v] of Object.entries(row)) {
            if (typeof v !== 'number' || !/GLP|ALT|^AVG_/.test(k)) continue;
            metrics[k] = v;
            board.parts[k] = k;
          }
          const setting = node.displayName.match(/\((Extended Thinking|high)\)$/i)?.[1]
            ?? (node.displayName.endsWith(':thinking') ? 'thinking' : undefined);
          rows.push({ model: row.model_name, setting, score: row.TOTAL_AVG, date: node.createdAt.slice(0, 10), metrics, link: 'https://wandb.ai/' + project + '/runs/' + node.name,
            params: typeof row.model_size === 'number' && row.model_size > 0 ? row.model_size / 1e9 : undefined });
        }
      }
      after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
      if (after) await pause();
    } while (after);
    if (rows.length < 99) throw new Error('Incomplete Nejumi leaderboard');
    return rows;
  },
};
export default board;

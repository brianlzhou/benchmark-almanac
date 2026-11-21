// OpenEarthAgent evaluates tool-assisted answers to geospatial questions. The updated tables give end-to-end answer accuracy and step-level metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const feed = "https://raw.githubusercontent.com/mbzuai-oryx/OpenEarthAgent/main/assets/end_to_end_updated.png";

const board: Leaderboard = {
  benchmark: "openearthagent",
  url: "https://github.com/mbzuai-oryx/OpenEarthAgent/blob/main/README.md#updated-benchmark-evaluation",
  feed,
  terms: "The authors publish separate updated tables for step prediction and live execution. The dataset license covers the dataset. The code repository lists no license for the result images. https://github.com/eve-esa/agents-evals/blob/main/src/agentic_evals/tasks/openearthagent/PORTING.md GitHub asks crawlers to wait one second.",
  aliases: {
    "Qwen3-Instruct-2507 4B": "qwen3-4b-instruct-2507",
    "InternLM3-Instruct 8B": "internlm3-8b",
    "Qwen2.5-Instruct 7B": "qwen2-5-7b",
    "Qwen2.5-Instruct 3B": "qwen2-5-3b",
    "Llama-3.1-Instruct 8B": "llama-3-1-8b",
  },
  async fetch() {
    const columns = ['Per.', 'Op.', 'Logic.', 'GIS.', 'AnyOr.', 'SameO.', 'Uni.', 'Ans.', 'Gen.', 'Inst.', 'Tool.', 'ArgN.', 'ArgV.', 'Summ.'];
    const records: [string, number[]][] = [
      ["gpt-5", [16.89, 47.76, 5.48, 91.88, 46.89, 46.45, 47.39, 44.50, 46.90, 96.54, 83.55, 73.43, 36.25, 88.82]],
      ["gpt-4o", [44.47, 66.97, 35.88, 95.86, 50.21, 49.70, 55.26, 39.68, 78.62, 99.43, 94.83, 86.57, 47.03, 89.50]],
      ["o4-mini", [40.14, 66.09, 12.41, 86.37, 39.86, 39.69, 41.40, 35.92, 56.55, 83.82, 69.78, 65.32, 38.76, 90.37]],
      ["Qwen2.5-Instruct 7B", [20.08, 37.29, 27.43, 75.20, 31.39, 29.85, 36.36, 16.55, 40.69, 94.76, 87.09, 79.76, 39.51, 80.15]],
      ["Llama-3.1-Instruct 8B", [22.48, 16.40, 31.75, 64.61, 39.09, 37.81, 44.82, 12.87, 55.17, 49.74, 41.15, 35.21, 18.98, 79.08]],
      ["InternLM3-Instruct 8B", [5.40, 14.85, 0.50, 31.41, 2.22, 1.88, 3.17, 0.24, 2.76, 47.88, 39.86, 30.48, 15.86, 31.26]],
      ["Mistral-Instruct-v0.3 7B", [6.69, 10.61, 16.23, 16.95, 2.65, 2.57, 2.91, 0.48, 5.52, 64.44, 35.97, 26.83, 13.09, 22.83]],
      ["Qwen2.5-Instruct 3B", [15.44, 16.89, 10.39, 35.53, 9.24, 8.73, 12.40, 1.60, 24.14, 85.65, 73.00, 65.43, 24.45, 70.41]],
      ["Qwen3-Instruct-2507 4B", [13.88, 21.66, 18.71, 71.79, 15.91, 14.62, 21.47, 13.72, 15.86, 97.63, 88.07, 85.18, 34.63, 84.53]],
      ["OpenEarthAgent 4B", [59.13, 55.73, 51.37, 98.52, 67.23, 66.72, 72.46, 45.63, 75.86, 99.68, 97.92, 96.86, 64.25, 84.60]],
    ];
    const rows = records.map(([model, values]) => ({
      model, score: values[7], params: Number(model.match(/ (\d+)B$/)?.[1]) || undefined,
      metrics: Object.fromEntries(columns.map((k, i) => [k, values[i]])),
    }));
    await checkedImageRows(feed.replace('end_to_end', 'step_by_step'), '5e2563e87236d753df84b5e1a444f2a95aef1a68f85b4ece95f7ad4d28f51afc', rows);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return checkedImageRows(feed, '2219c674ee4b13bf3faddc28bd0299675a6ae56c67db78a8e41cc6cad6134786', rows);
  },
};

export default board;

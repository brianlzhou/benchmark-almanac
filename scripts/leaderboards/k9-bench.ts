// K9-Bench scores video models on multiple-choice questions about dog behavior.
// The project publishes its main results as an image. A hash check ties these values to that image.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = "https://ogmenrobotics.github.io/K9Bench/static/media/main_results.png";
const board: Leaderboard = {
  benchmark: "k9-bench",
  url: "https://ogmenrobotics.github.io/K9Bench/static/media/main_results.png",
  feed,
  terms: "The project website credits CC BY-SA 4.0. The separate dataset terms limit use of video material to noncommercial research. The site returned 404 for robots.txt.",
  parts: { posture: 'Posture Analysis', action: 'Action Sequence', context: 'Context Analysis', cause: 'Cause-Effect Analysis', interaction: 'Interaction Analysis' },
  async fetch() {
    return chartRows(feed, '8802fcdb1d96ea61f8a9745d000b77c0f63ec93ac9e2049f872945fb8a318e7c', [
      {"model":"Gemini-2.5 Pro","score":40.1,"setting":"1 FPS","metrics":{"posture":37.7,"action":36,"context":44,"cause":44.7,"interaction":42.3}},
      {"model":"Qwen3VL-235B-A22B","score":36.5,"setting":"1 FPS","metrics":{"posture":34.2,"action":33.5,"context":38.4,"cause":39.9,"interaction":39.4}},
      {"model":"GPT-4o","score":30.8,"setting":"32 frames","metrics":{"posture":29.6,"action":26.3,"context":35,"cause":33.9,"interaction":33.9}},
      {"model":"Qwen3-VL-4B","score":27.6,"setting":"32 frames","metrics":{"posture":27.6,"action":24.1,"context":30.8,"cause":28.2,"interaction":30.9}},
      {"model":"Qwen3-VL-8B","score":28.8,"setting":"32 frames","metrics":{"posture":27.8,"action":26.5,"context":32.1,"cause":27.6,"interaction":31.9}},
      {"model":"Qwen3-VL-32B","score":31.4,"setting":"32 frames","metrics":{"posture":28.2,"action":29.3,"context":35.4,"cause":31.1,"interaction":35}},
      {"model":"InternVL-8B","score":32.2,"setting":"32 frames","metrics":{"posture":29,"action":27.9,"context":34,"cause":36,"interaction":37.5}},
      {"model":"InternVL-14B","score":33,"setting":"32 frames","metrics":{"posture":31.5,"action":30.3,"context":33.7,"cause":35.9,"interaction":36.1}},
      {"model":"Qwen3-VL-32B-Thinking","score":30.7,"setting":"32 frames","metrics":{"posture":27.8,"action":28.8,"context":33.7,"cause":32.8,"interaction":32.1}},
      {"model":"Qwen3-VL-8B-Thinking","score":25.3,"setting":"32 frames","metrics":{"posture":24,"action":21.8,"context":29.7,"cause":24.9,"interaction":29.3}},
      {"model":"Qwen3-VL-4B-Thinking","score":22.4,"setting":"32 frames","metrics":{"posture":21.2,"action":18,"context":28,"cause":23.1,"interaction":26.2}}
    ]);
  },
};
export default board;

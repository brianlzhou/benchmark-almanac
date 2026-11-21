// The Hugging Face Space ranks COCO detectors by average precision. Its Gradio configuration contains the displayed table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://hf-vision-object-detection-leaderboard.hf.space/config";

const board: Leaderboard = {
  benchmark: "hf-object-detection-leaderboard",
  url: "https://huggingface.co/spaces/hf-vision/object_detection_leaderboard",
  feed,
  terms: "See the publisher’s Space and each upstream dataset license at https://huggingface.co/spaces/hf-vision/object_detection_leaderboard Hugging Face allows the public Space in robots.txt.",
  parts: { 'AP-S': 'AP-S', 'AP-M': 'AP-M', 'AP-L': 'AP-L' },
  async fetch() {
    type Table = {headers?: string[], data?: (string | null)[][]};
    const config = await fetchJson<{components: {props: {value?: Table}}[]}>(feed);
    const cols = ['model', 'AP', 'AP@.50', 'AP@.75', 'AP-S', 'AP-M', 'AP-L', 'AR1', 'AR10', 'AR100', 'AR-S', 'AR-M', 'AR-L', 'FPS(*)', 'hub license'];
    const table = config.components.map(c => c.props.value).find(t => t?.headers?.join('|') === cols.join('|'));
    if (!table?.data || table.data.length < 30) throw new Error('Missing COCO detector results');
    return table.data.map(c => {
      const model = text(c[0] ?? '');
      const metrics = Object.fromEntries(cols.slice(1, -1).map((k, i) => {
        const v = Number.parseFloat(c[i + 1] ?? '');
        if (!Number.isFinite(v)) throw new Error('Missing ' + k + ' for ' + model);
        return [k, v];
      }));
      return { model, score: metrics.AP, metrics, license: c.at(-1) ?? undefined, link: c[0]?.match(/href="([^"]+)"/)?.[1] };
    });
  },
};

export default board;

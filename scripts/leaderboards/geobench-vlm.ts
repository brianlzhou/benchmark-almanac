// GEOBench-VLM tests interpretation of satellite and aerial imagery. The leaderboard supplies average accuracy
// and accuracy on each of 17 tasks, all on a zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://the-ai-alliance.github.io/GEO-Bench-VLM/";

const board: Leaderboard = {
  benchmark: "geobench-vlm",
  url: "https://the-ai-alliance.github.io/GEO-Bench-VLM/",
  feed,
  terms: "The score table is embedded in the page. Its footer attributes CC BY-SA 4.0 to the site template. Separate score reuse terms are unspecified. The host has no robots.txt.",
  parts: {"Aircraft Classification": "Aircraft Classification", "Building Counting": "Building Counting", "Crop Classification": "Crop Classification", "Disaster Classification": "Disaster Classification", "Fire Risk Assessment": "Fire Risk Assessment", "General Aircraft Counting": "General Aircraft Counting", "General Vehicle Counting": "General Vehicle Counting", "Land Use Classification": "Land Use Classification", "Marine Debris Counting": "Marine Debris Counting", "Scene Classification": "Scene Classification", "Ship Classification": "Ship Classification", "Specific Aircraft Counting": "Specific Aircraft Counting", "Specific Vehicle Counting": "Specific Vehicle Counting", "Sptatial Relationship": "Spatial Relationship", "Tree Health Assessment": "Tree Health Assessment", "Trees Counting": "Trees Counting", "Water Bodies Counting": "Water Bodies Counting"},
  async fetch() {
    const header = ["Model", "Aircraft Classification", "Building Counting", "Crop Classification", "Disaster Classification", "Fire Risk Assessment", "General Aircraft Counting", "General Vehicle Counting", "Land Use Classification", "Marine Debris Counting", "Scene Classification", "Ship Classification", "Specific Aircraft Counting", "Specific Vehicle Counting", "Sptatial Relationship", "Tree Health Assessment", "Trees Counting", "Water Bodies Counting", "Average"];
    const table = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text))).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 13) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const model = cells[0], values = cells.slice(1).map(Number);
      if (!model || values.length !== header.length - 1 || cells.slice(1).some(s => !s.trim()) || !values.every(Number.isFinite))
        throw new Error('Missing geospatial score');
      return { model, score: values[values.length - 1], metrics: Object.fromEntries(header.slice(1, -1).map((name, i) => [name, values[i]])) };
    });
  },
};
export default board;

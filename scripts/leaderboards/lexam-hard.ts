// Official chart labels, transcribed 2026-11-10. Model repository identities and run dates
// come from the maker's reproduction/manifest.json. Only the 518-question hard split is imported.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';
const IMAGE = 'https://huggingface.co/datasets/joelniklaus/LEXam-hard/resolve/main/figures/lexam_full_vs_hard.png';
const ROWS: LeaderboardRow[] = [
  {
    "model": "thinkingmachines/Inkling",
    "score": 40.8,
    "date": "2026-07-30",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "deepseek-ai/DeepSeek-V4-Pro",
    "score": 38.9,
    "date": "2026-06-13",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "score": 38.2,
    "date": "2026-06-12",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "openai/gpt-oss-120b",
    "score": 37.6,
    "date": "2026-06-11",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "zai-org/GLM-5.2",
    "score": 37.5,
    "date": "2026-06-24",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "google/gemma-4-31B-it",
    "score": 37.4,
    "date": "2026-06-11",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "MiniMaxAI/MiniMax-M3",
    "score": 37.1,
    "date": "2026-06-20",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-NVFP4",
    "score": 36.7,
    "date": "2026-06-12",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "moonshotai/Kimi-K2.6",
    "score": 36.2,
    "date": "2026-06-18",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "mistralai/Mistral-Medium-3.5-128B",
    "score": 31.9,
    "date": "2026-07-27",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "moonshotai/Kimi-K3",
    "score": 29.5,
    "date": "2026-08-03",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "score": 26.8,
    "date": "2026-07-12",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "swiss-ai/Apertus-v1.5-70B",
    "score": 24.4,
    "date": "2026-07-28",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "Qwen/Qwen3.5-35B-A3B",
    "score": 23.9,
    "date": "2026-08-01",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "allenai/Olmo-3.1-32B-Think",
    "score": 18.4,
    "date": "2026-07-31",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  },
  {
    "model": "LiquidAI/LFM2.5-8B-A1B",
    "score": 15.5,
    "date": "2026-06-11",
    "setting": "DeepSeek-R1-0528 judge; mean of German and English means"
  }
];
const board: Leaderboard = {benchmark:'lexam-hard',url:'https://huggingface.co/datasets/joelniklaus/LEXam-hard',feed:IMAGE,terms:'Official public dataset-card results. The almanac credits SwissLegalEvals and links the source.',fetch:()=>checkedImageRows(IMAGE,'465bd17d3554c9e7cb9bd8ef74dacc13480f3450789d76902154315e46975ac2',ROWS)};
export default board;

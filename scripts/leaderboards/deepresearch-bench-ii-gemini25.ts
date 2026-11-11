// Legacy Gemini 2.5 Pro grading is incompatible with the current GPT-5.5 evaluator.
import board, {fetchDRB2Rows} from './deepresearch-bench-ii.ts';
export default {...board, benchmark:'deepresearch-bench-ii-gemini25', feed:'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data_drb2/leaderboard_gemini25.csv', fetch:()=>fetchDRB2Rows('https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data_drb2/leaderboard_gemini25.csv','Gemini 2.5 Pro evaluator')};

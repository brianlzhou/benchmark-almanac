// AI Engineering Lab tests generated Exudyn simulations against numerical references.
// The authors publish overall and per-system correctness percentages in the quick summaries inside allTests.zip.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { execFileSync } from 'node:child_process';

const feed = 'https://raw.githubusercontent.com/jgerstmayr/AI-engineering-lab/main/logsTM/allTests.zip';
const readSummaries = `
import io, json, re, sys, zipfile
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as archive:
    print(json.dumps([archive.read(f).decode() for f in archive.infolist()
        if re.fullmatch(r"log_[^/]+/quickinfo.md", f.filename) and f.file_size < 1000000]))
`;
const board: Leaderboard = {
  benchmark: 'ai-engineering-lab-model-creation',
  url: 'https://github.com/jgerstmayr/AI-engineering-lab/tree/main/logsTM',
  feed,
  terms: 'The repository uses BSD 3-Clause. The raw GitHub host returns 404 for robots.txt.',
  aliases: {
    'meta-llama/Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'meta-llama/Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Codestral-22B-v0.1-Q6_K.gguf': 'codestral',
    'DeepSeek-Coder-V2-Lite-Instruct-Q6_K.gguf': 'deepseek-coder-v2-lite-instruct',
    'deepseek-coder-33b-instruct.Q4_0.gguf': 'deepseek-coder-33b',
    'Meta-Llama-3-8B-Instruct.Q4_0.gguf': 'llama-3-8b',
    'Meta-Llama-3.1-8B-Instruct-128k-Q4_0.gguf': 'llama-3-1-8b',
    'phi-4-Q4_0.gguf': 'phi-4', 'Qwen2.5-32B-Instruct-Q4_K_L.gguf': 'qwen2-5-32b',
    'qwen2.5-coder-32b-instruct-q4_0.gguf': 'qwen2-5-coder-32b-instruct',
  },
  async fetch() {
    const summaries: string[] = JSON.parse(execFileSync('python3', ['-c', readSummaries], {
      input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8', maxBuffer: 16_000_000,
    }));
    if (summaries.length < 14) throw new Error('Missing Engineering Lab configurations');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const summary of summaries) {
      const model = summary.match(/using LLM model: ([^\r\n]+)/)?.[1];
      const overall = summary.match(/^executable\s*=\s*([\d.]+)%\s+correct\s*=\s*([\d.]+)%/m);
      const tokens = summary.match(/numberOfTokensGlobal:(\d+), numberOfRemovedTokensGlobal:(\d+), tokensPerSecondGlobal:([\d.]+)/);
      if (!model || !overall || !tokens) throw new Error('Invalid Engineering Lab summary');
      const metrics: Record<string, number> = { executable: +overall[1], totalTokens: +tokens[1], removedTokens: +tokens[2], tokensPerSecond: +tokens[3] };
      const systems = [...summary.matchAll(/SUMMARY model (\w+): exec=([\d.]+)%, correct=([\d.]+)%/g)];
      if (systems.length < 35) throw new Error('Missing Engineering Lab systems');
      for (const [, name, executable, correct] of systems) {
        parts[name] = name;
        metrics[name] = +correct;
        metrics[name + 'Executable'] = +executable;
      }
      const setting = model.match(/[.-](Q\d(?:_[A-Z\d]+)*)\.gguf$/i)?.[1] ?? 'HF';
      rows.push({ model, setting, score: +overall[2], metrics });
    }
    board.parts = parts;
    return rows;
  },
};
export default board;

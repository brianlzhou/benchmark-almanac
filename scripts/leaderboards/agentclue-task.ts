// AgentCLUE-Task ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "agentclue-task",
  url: "https://www.superclueai.com/agent/Task",
  feed: "https://www.superclueai.com/data/agent_list/Task/2026%E5%B9%B47%E6%9C%88.xlsx",
  roundFolder: "Task",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 6,
  // the board gives time in minutes, and agentclue.ts stores it as `latency` in seconds
  stats: {
    costPerTaskCny: { name: 'Average cost per question', unit: 'cny', better: 'lower' },
    latency: { name: 'Average time per question', unit: 'seconds', better: 'lower' },
    totalTokens: { name: 'Average tokens per question', unit: 'tokens' },
  },
  metrics: { costPerTaskCny: "平均每题成本（元）", latencyMinutes: "平均每题耗时（分钟）", totalTokens: "平均每题token消耗" },
  parts: ["外卖点单", "电商零售", "电子政务", "购票服务", "电信领域"],
});

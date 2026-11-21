// AgentCLUE-Mobile ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "agentclue-mobile",
  url: "https://www.superclueai.com/agent/AgentCLUE-Mobile",
  feed: "https://www.superclueai.com/data/agent_list/AgentCLUE-Mobile/2026%E5%B9%B48%E6%9C%88.xlsx",
  roundFolder: "AgentCLUE-Mobile",
  sheet: "总榜",
  model: "底层模型",
  score: "总分",
  minimum: 6,
  stats: { stepsPerTask: { name: 'Average steps per task', unit: 'count', better: 'lower' } },
  parts: ["简单任务得分", "中等任务得分", "困难任务得分", "端到端完成率", "复杂意图拆解与动态规划", "多模态GUI感知与理解", "跨应用全链路执行"],
  metrics: {"stepsPerTask": "平均每题步数"},
  harness: "产品",
  percentages: ["端到端完成率"],
});

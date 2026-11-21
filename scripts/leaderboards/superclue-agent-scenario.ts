// SuperCLUE-Agent Scenario ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-agent-scenario",
  url: "https://www.superclueai.com/agent/AgentScenario",
  feed: "https://www.superclueai.com/data/agent_list/AgentScenario/2026%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "AgentScenario",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 6,
  parts: ["编码能力", "记忆能力", "内容创作", "数据处理", "研究分析"],
});

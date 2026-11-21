// AgentCLUE-General ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "agentclue-general",
  url: "https://www.superclueai.com/agent/AgentCLUE-General",
  feed: "https://www.superclueai.com/data/agent_list/AgentCLUE-General/2025%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "AgentCLUE-General",
  sheet: "总榜",
  model: "第三方平台",
  score: "总分",
  minimum: 7,
  parts: ["Level 1", "Level 2", "Level 3"],
  details: [{"sheet": "应用场景榜单", "model": "第三方平台", "parts": ["联网检索", "数据分析", "多模态理解", "多场景组合"]}, {"sheet": "产品信息", "model": "产品名称", "parts": []}],
});

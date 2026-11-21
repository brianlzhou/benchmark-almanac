// SuperCLUE-DeepResearch ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-deepresearch",
  url: "https://www.superclueai.com/agent/DeepResearch",
  feed: "https://www.superclueai.com/data/agent_list/DeepResearch/2025%E5%B9%B46%E6%9C%88.xlsx",
  roundFolder: "DeepResearch",
  sheet: "总榜",
  model: "产品名称",
  score: "总分",
  minimum: 9,
  parts: ["深度检索", "研究分析", "实践应用", "规划咨询"],
  settings: ["使用方式"],
  details: [{"sheet": "深度检索", "model": "产品名称", "parts": ["深度检索能力"]}, {"sheet": "研究分析", "model": "产品名称", "parts": ["研究分析能力"]}, {"sheet": "实践应用", "model": "产品名称", "parts": ["实践应用能力"]}, {"sheet": "规划咨询", "model": "产品名称", "parts": ["规划咨询能力"]}],
});

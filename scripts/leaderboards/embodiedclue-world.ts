// EmbodiedCLUE-World ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "embodiedclue-world",
  url: "https://www.superclueai.com/embodied/E_World",
  feed: "https://www.superclueai.com/data/embodied_list/E_World/2026%E5%B9%B45%E6%9C%88.xlsx",
  roundFolder: "E_World",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 7,
  parts: [],
  settings: ["使用方式"],
  details: [{"sheet": "各指标加权分数", "model": "模型名称", "parts": ["任务遵循", "物理交互", "空间一致", "轨迹运动", "内容语义", "结果诊断"]}],
});

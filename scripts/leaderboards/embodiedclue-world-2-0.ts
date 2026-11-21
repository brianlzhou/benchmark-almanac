// EmbodiedCLUE-World 2.0 ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "embodiedclue-world-2-0",
  url: "https://www.superclueai.com/embodied/E_World2",
  feed: "https://www.superclueai.com/data/embodied_list/E_World2/2026%E5%B9%B47%E6%9C%88.xlsx",
  roundFolder: "E_World2",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 6,
  parts: [],
  settings: ["使用方式"],
  details: [{"sheet": "各指标分数", "model": "模型名称", "parts": ["任务完成", "物理接触", "运动质量", "内容一致", "三维空间", "视觉质量"]}],
});

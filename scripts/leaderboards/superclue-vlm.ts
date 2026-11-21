// SuperCLUE-VLM ranks entries by 总分 on its 总榜成绩 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-vlm",
  url: "https://www.superclueai.com/multimodal/VLM",
  feed: "https://www.superclueai.com/data/multimodal_list/VLM/2026%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "VLM",
  sheet: "总榜成绩",
  model: "模型名称",
  score: "总分",
  minimum: 15,
  parts: ["基础认知能力", "视觉推理能力", "视觉应用能力"],
  settings: ["使用方式"],
  details: [{"sheet": "基础认知能力", "model": "模型名称", "parts": ["分数", "信息解析", "通用识别"]}, {"sheet": "视觉推理能力", "model": "模型名称", "parts": ["分数", "学科推理", "应用推理"]}, {"sheet": "视觉应用能力", "model": "模型名称", "parts": ["分数", "安全风控", "智能交互", "行业应用"]}],
});

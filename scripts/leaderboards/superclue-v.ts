// SuperCLUE-V ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-v",
  url: "https://www.superclueai.com/multimodal/V",
  feed: "https://www.superclueai.com/data/multimodal_list/V/2024%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "V",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 17,
  parts: ["基础认知能力", "应用能力"],
  settings: ["使用方式"],
  details: [{"sheet": "基础认知能力", "model": "模型名称", "parts": ["分数", "粗粒度视觉认知", "细粒度视觉认知", "数理逻辑分析", "多模态多轮问答"]}, {"sheet": "应用能力", "model": "模型名称", "parts": ["分数", "通用场景", "常识问答", "图像OCR识别与理解", "中文元素理解和推理"]}],
});
